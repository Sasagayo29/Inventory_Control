import os
import sys
import shutil
import io
import webbrowser
import uvicorn
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, func, Float, desc
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from passlib.context import CryptContext
import pandas as pd
import qrcode

# --- 1. CONFIGURAÇÃO DE CAMINHOS ABSOLUTA ---
# Define a pasta raiz com base em se está rodando como script ou .exe
if getattr(sys, 'frozen', False):
    # Se for .exe (PyInstaller), a pasta base é onde o .exe está
    BASE_DIR = os.path.dirname(sys.executable)
else:
    # Se for python normal, é a pasta do arquivo
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DB_PATH = os.path.join(BASE_DIR, "estoque.db")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
STATIC_DIR = os.path.join(BASE_DIR, "static")

# --- 2. BANCO DE DADOS ---
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- 3. MODELOS ---
class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    matricula = Column(String, unique=True, index=True)
    senha_hash = Column(String)
    tipo = Column(String)
    empresa = Column(String, default="Kinross")

class Categoria(Base):
    __tablename__ = "categorias"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, index=True)

class Item(Base):
    __tablename__ = "itens"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True)
    codigo_qr = Column(String, unique=True, index=True)
    custo_unitario = Column(Float, default=0.0)
    estoque_atual = Column(Integer, default=0)
    estoque_minimo = Column(Integer, default=5)
    categoria = Column(String, default="Geral")
    localizacao = Column(String, default="N/A")
    serial_number = Column(String, nullable=True)
    part_number = Column(String, nullable=True)
    marca = Column(String, nullable=True)
    modelo = Column(String, nullable=True)
    fabricante = Column(String, nullable=True)
    imagem_url = Column(String, nullable=True)

class Movimentacao(Base):
    __tablename__ = "movimentacoes"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("itens.id"))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    tipo = Column(String)
    quantidade = Column(Integer, default=1)
    motivo = Column(String)
    data_hora = Column(DateTime, default=datetime.now)
    item = relationship("Item")
    usuario = relationship("Usuario")

# Cria estrutura inicial
Base.metadata.create_all(bind=engine)
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Monta pasta de uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def get_password_hash(password): return pwd_context.hash(password)
def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)

class LoginReq(BaseModel): matricula: str; senha: str
class UsuarioReq(BaseModel): 
    nome: str; matricula: str; senha: str; tipo: str = "comum"; empresa: str = "Kinross"
class MovimentoReq(BaseModel):
    matricula_usuario: str; codigo_qr_item: str; tipo: str; motivo: str; quantidade: int
class CategoriaReq(BaseModel): nome: str

# --- ENDPOINTS (API) ---

@app.post("/login")
def login(req: LoginReq, db: Session = Depends(get_db)):
    if db.query(Usuario).count() == 0:
        db.add(Usuario(nome="Admin", matricula="admin", senha_hash=get_password_hash("admin123"), tipo="admin"))
        db.commit()
    user = db.query(Usuario).filter(Usuario.matricula == req.matricula).first()
    if not user or not verify_password(req.senha, user.senha_hash):
        raise HTTPException(status_code=401, detail="Inválido")
    return {"nome": user.nome, "tipo": user.tipo, "matricula": user.matricula, "empresa": user.empresa}

@app.get("/categorias")
def listar_categorias(db: Session = Depends(get_db)):
    cats = db.query(Categoria).all()
    if not cats:
        padroes = ["Geral", "EPI", "Ferramentas", "Consumíveis", "Elétrica", "Hidráulica", "TI", "Mecânica"]
        for p in padroes: db.add(Categoria(nome=p))
        db.commit()
        return db.query(Categoria).all()
    return cats

@app.post("/categorias")
def criar_categoria(req: CategoriaReq, db: Session = Depends(get_db)):
    if db.query(Categoria).filter(Categoria.nome == req.nome).first(): raise HTTPException(400, "Existe")
    db.add(Categoria(nome=req.nome)); db.commit(); return {"msg": "Criada"}

@app.put("/categorias/{cat_id}")
def atualizar_categoria(cat_id: int, req: CategoriaReq, db: Session = Depends(get_db)):
    cat = db.query(Categoria).filter(Categoria.id == cat_id).first()
    if not cat: raise HTTPException(404)
    old = cat.nome; cat.nome = req.nome
    db.query(Item).filter(Item.categoria == old).update({Item.categoria: req.nome})
    db.commit(); return {"msg": "Atualizado"}

@app.delete("/categorias/{cat_id}")
def deletar_categoria(cat_id: int, db: Session = Depends(get_db)):
    cat = db.query(Categoria).filter(Categoria.id == cat_id).first()
    if not cat: raise HTTPException(404)
    if db.query(Item).filter(Item.categoria == cat.nome).count() > 0: raise HTTPException(400, "Em uso")
    db.delete(cat); db.commit(); return {"msg": "Deletado"}

@app.post("/itens")
async def criar_item(nome: str = Form(...), estoque_inicial: int = Form(...), estoque_minimo: int = Form(5), custo_unitario: float = Form(0.0), categoria: str = Form("Geral"), localizacao: str = Form(""), serial_number: str = Form(""), part_number: str = Form(""), marca: str = Form(""), modelo: str = Form(""), fabricante: str = Form(""), foto: UploadFile = File(None), db: Session = Depends(get_db)):
    if db.query(Item).filter(Item.nome == nome).first(): raise HTTPException(400, "Nome existe")
    codigo = f"ITM-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    path = None
    if foto:
        name = f"img_{codigo}_{foto.filename}"
        p = os.path.join(UPLOAD_DIR, name)
        with open(p, "wb") as b: shutil.copyfileobj(foto.file, b)
        path = f"http://localhost:8000/uploads/{name}"
    db.add(Item(nome=nome, codigo_qr=codigo, estoque_atual=estoque_inicial, estoque_minimo=estoque_minimo, custo_unitario=custo_unitario, categoria=categoria, localizacao=localizacao, imagem_url=path, serial_number=serial_number, part_number=part_number, marca=marca, modelo=modelo, fabricante=fabricante))
    db.commit()
    img = qrcode.make(codigo); img.save(os.path.join(BASE_DIR, f"qr_{codigo}.png"))
    return {"msg": "Criado", "codigo": codigo}

@app.get("/itens")
def listar_itens(db: Session = Depends(get_db)): return db.query(Item).all()

@app.put("/itens/{item_id}")
async def atualizar_item(item_id: int, nome: str = Form(...), estoque_atual: int = Form(...), estoque_minimo: int = Form(...), custo_unitario: float = Form(0.0), marca: str = Form(""), modelo: str = Form(""), fabricante: str = Form(""), serial_number: str = Form(""), part_number: str = Form(""), foto: UploadFile = File(None), remover_imagem: bool = Form(False), db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item: raise HTTPException(404)
    item.nome=nome; item.estoque_atual=estoque_atual; item.estoque_minimo=estoque_minimo; item.custo_unitario=custo_unitario; item.marca=marca; item.modelo=modelo; item.fabricante=fabricante; item.serial_number=serial_number; item.part_number=part_number
    if remover_imagem: item.imagem_url = None
    elif foto:
        code = item.codigo_qr.replace("ITM-", "")
        name = f"img_EDIT_{code}_{foto.filename}"
        p = os.path.join(UPLOAD_DIR, name)
        with open(p, "wb") as b: shutil.copyfileobj(foto.file, b)
        item.imagem_url = f"http://localhost:8000/uploads/{name}"
    db.commit(); return {"msg": "Atualizado"}

@app.delete("/itens/{item_id}")
def deletar_item(item_id: int, db: Session = Depends(get_db)): db.query(Item).filter(Item.id == item_id).delete(); db.commit(); return {"msg": "Deletado"}

@app.get("/dashboard-stats")
def stats(db: Session = Depends(get_db)):
    total_itens = db.query(func.count(Item.id)).scalar()
    total_users = db.query(func.count(Usuario.id)).scalar()
    criticos_query = db.query(Item.nome, Item.estoque_atual, Item.estoque_minimo).filter(Item.estoque_atual < Item.estoque_minimo).all()
    lista_criticos = [{"nome": c.nome, "atual": c.estoque_atual, "min": c.estoque_minimo} for c in criticos_query]
    valuation = db.query(func.sum(Item.estoque_atual * Item.custo_unitario)).scalar() or 0.0
    tendencia = db.query(func.date(Movimentacao.data_hora).label("data"), func.count(Movimentacao.id).label("total")).filter(Movimentacao.data_hora >= datetime.now() - timedelta(days=7)).group_by("data").all()
    top5 = db.query(Item.nome, func.count(Movimentacao.id).label("qtd")).join(Movimentacao).group_by(Item.id).order_by(desc("qtd")).limit(5).all()
    fin_cat = db.query(Item.categoria, func.sum(Item.estoque_atual * Item.custo_unitario)).group_by(Item.categoria).all()
    return {"kpis": {"total_itens": total_itens, "total_users": total_users, "qtd_criticos": len(lista_criticos), "valuation": valuation}, "lista_criticos": lista_criticos, "graficos": {"tendencia": {"labels": [t.data for t in tendencia], "data": [t.total for t in tendencia]}, "top5": {"labels": [t.nome for t in top5], "data": [t.qtd for t in top5]}, "financeiro": {"labels": [f[0] for f in fin_cat], "data": [f[1] or 0 for f in fin_cat]}}}

@app.post("/importar")
async def importar(arquivo: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        c = await arquivo.read()
        df = pd.read_excel(io.BytesIO(c)).fillna("")
        criados, atualizados = 0, 0
        for _, r in df.iterrows():
            nome = str(r.get('Nome', '')).strip()
            if not nome: continue
            item = db.query(Item).filter(Item.nome == nome).first()
            def si(v): 
                try: return int(float(v))
                except: return 0
            est = si(r.get('Estoque', 0)); min_ = si(r.get('Minimo', 5)); cust = float(r.get('Custo', 0.0))
            if item:
                item.estoque_atual=est; item.estoque_minimo=min_; item.custo_unitario=cust
                atualizados += 1
            else:
                cod = f"IMP-{datetime.now().strftime('%Y%m%d%H%M')}-{_}"
                db.add(Item(nome=nome, estoque_atual=est, estoque_minimo=min_, custo_unitario=cust, codigo_qr=cod))
                criados += 1
        db.commit(); return {"msg": f"Criados: {criados}, Atualizados: {atualizados}"}
    except Exception as e: raise HTTPException(400, str(e))

@app.get("/exportar-itens")
def exportar_itens(db: Session = Depends(get_db)):
    itens = db.query(Item).all()
    data = [{"Nome":i.nome, "Estoque":i.estoque_atual, "Custo":i.custo_unitario} for i in itens]
    df = pd.DataFrame(data) if data else pd.DataFrame(columns=["Nome","Estoque","Custo"])
    path = os.path.join(BASE_DIR, "estoque.xlsx")
    df.to_excel(path, index=False); return FileResponse(path, filename="estoque.xlsx")

@app.get("/usuarios")
def usuarios(db: Session = Depends(get_db)): return db.query(Usuario).all()
@app.post("/usuarios")
def add_user(req: UsuarioReq, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.matricula==req.matricula).first(): raise HTTPException(400,"Existe")
    db.add(Usuario(nome=req.nome,matricula=req.matricula,tipo=req.tipo,senha_hash=get_password_hash(req.senha),empresa=req.empresa)); db.commit(); return {"msg":"Criado"}
@app.put("/usuarios/{uid}")
def upd_user(uid:int,req:UsuarioReq,db:Session=Depends(get_db)):
    u=db.query(Usuario).filter(Usuario.id==uid).first(); u.nome=req.nome;u.matricula=req.matricula;u.tipo=req.tipo;u.empresa=req.empresa
    if req.senha: u.senha_hash=get_password_hash(req.senha)
    db.commit(); return {"msg":"Atualizado"}
@app.delete("/usuarios/{uid}")
def del_user(uid:int,db:Session=Depends(get_db)): db.query(Usuario).filter(Usuario.id==uid).delete(); db.commit(); return {"msg":"Deletado"}
@app.post("/movimentar")
def mov(req: MovimentoReq, db: Session = Depends(get_db)):
    u = db.query(Usuario).filter(Usuario.matricula==req.matricula_usuario).first()
    i = db.query(Item).filter(Item.codigo_qr==req.codigo_qr_item).first()
    if not u or not i: raise HTTPException(404)
    if req.tipo=='saida':
        if i.estoque_atual < req.quantidade: raise HTTPException(400,"Insuficiente")
        i.estoque_atual -= req.quantidade
    else: i.estoque_atual += req.quantidade
    db.add(Movimentacao(item_id=i.id,usuario_id=u.id,tipo=req.tipo,quantidade=req.quantidade,motivo=req.motivo)); db.commit(); return {"msg":"Sucesso"}
@app.get("/historico")
def hist(db: Session = Depends(get_db)): return [{"data_hora":x.data_hora,"usuario":x.usuario.nome,"item":x.item.nome,"tipo":x.tipo,"quantidade":x.quantidade,"motivo":x.motivo} for x in db.query(Movimentacao).order_by(Movimentacao.data_hora.desc()).limit(50).all()]
@app.get("/exportar")
def exp(): 
    path = os.path.join(BASE_DIR, "relatorio.xlsx")
    pd.read_sql_query("SELECT * FROM movimentacoes", engine).to_excel(path, index=False); return FileResponse(path)

# --- 7. SERVIR FRONTEND (CORRIGIDO PARA SPA) ---

@app.get("/")
async def read_root():
    # Rota raiz explicita serve o index.html
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "Frontend (index.html) não encontrado na pasta static."}

@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    # 1. Tenta servir arquivo real (css, js, png)
    file_path = os.path.join(STATIC_DIR, full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # 2. Se não achar arquivo, devolve index.html para o Angular tratar a rota
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return {"error": f"Arquivo não encontrado: {full_path}"}

# --- 8. EXECUÇÃO BLINDADA (.EXE) ---
if __name__ == "__main__":
    # SOLUÇÃO DEFINITIVA PARA ERRO ISATTY/LOGGING
    
    # 1. Classe Dummy Completa
    class NullWriter:
        def write(self, text): pass
        def flush(self): pass
        def isatty(self): return False
        def close(self): pass
        def encoding(self): return 'utf-8'
    
    # 2. Substitui I/O padrão ANTES de qualquer coisa
    if sys.stdout is None: sys.stdout = NullWriter()
    if sys.stderr is None: sys.stderr = NullWriter()
    if sys.stdin is None: sys.stdin = NullWriter()

    print("Iniciando Sistema WMS...")
    
    # 3. Tenta abrir navegador
    try:
        webbrowser.open("http://localhost:8000")
    except:
        pass
    
    # 4. Configuração crucial: log_config=None
    # Isso desativa o sistema de log do uvicorn que tenta pintar o terminal
    uvicorn.run(app, host="0.0.0.0", port=8000, log_config=None)