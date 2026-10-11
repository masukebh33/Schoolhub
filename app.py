import os, sqlite3
from datetime import date, timedelta
from flask import Flask, request, jsonify, session, g, abort, send_from_directory
from werkzeug.security import generate_password_hash as H, check_password_hash as CH

BASE = os.path.dirname(os.path.abspath(__file__))
# Vercel inaruhusu kuandika /tmp tu (data hufutika)
DB = "/tmp/schoolhub.db" if os.environ.get("VERCEL") else os.path.join(BASE, "schoolhub.db")
app = Flask(__name__, static_folder="public", static_url_path="")
app.secret_key = os.environ.get("SECRET_KEY", "BADILISHA-KEY-HII")

# jedwali -> safu zake
RES = {
    "students": ["name", "email", "class_name", "phone", "status"],
    "teachers": ["name", "email", "subject", "phone"],
    "classes": ["name", "teacher", "room", "subject"],
    "attendance": ["student", "class_name", "date", "status"],
    "exams": ["subject", "class_name", "date", "duration", "status"],
    "books": ["title", "author", "copies", "status"],
    "fees": ["student", "class_name", "amount", "status", "due_date", "method"],
    "transport": ["route", "driver", "vehicle", "students"],
    "messages": ["recipient", "subject", "body", "date", "status"],
}
TEACHER_BLOCK = {"fees", "teachers", "transport"}  # mwalimu haoni hizi

def db():
    if "db" not in g:
        g.db = sqlite3.connect(DB)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close(_):
    d = g.pop("db", None)
    if d: d.close()

def seed(c):
    t = date.today()
    c.executemany("INSERT INTO users(username,password,role,name) VALUES(?,?,?,?)",
        [("admin", H("admin123"), "admin", "Msimamizi"), ("mwalimu", H("mwalimu123"), "teacher", "Mwalimu Juma")])
    c.execute("INSERT INTO settings VALUES('school_name','SchoolHub')")
    for n, s in [("Sarah Johnson", "Hisabati"), ("Michael Chen", "Kiingereza"), ("Emily Davis", "Sayansi")]:
        c.execute("INSERT INTO teachers(name,email,subject,phone) VALUES(?,?,?,?)", (n, n.split()[0].lower() + "@shule.ac.tz", s, "0710000000"))
    for i, (n, tn) in enumerate([("Grade 5-A", "Sarah Johnson"), ("Grade 5-B", "Michael Chen")]):
        c.execute("INSERT INTO classes(name,teacher,room,subject) VALUES(?,?,?,?)", (n, tn, f"A10{i+1}", "Hisabati"))
    for i, n in enumerate(["Alice Johnson", "Bob Smith", "Carol Davis", "David Wilson", "Amina Hassan", "Juma Ali"]):
        cl = ["Grade 5-A", "Grade 5-B"][i % 2]
        c.execute("INSERT INTO students(name,email,class_name,phone,status) VALUES(?,?,?,?,?)", (n, n.split()[0].lower() + "@email.com", cl, "0700000000", "Active"))
        c.execute("INSERT INTO fees(student,class_name,amount,status,due_date,method) VALUES(?,?,?,?,?,?)",
                  (n, cl, "1200000", ["Paid", "Overdue", "Pending"][i % 3], str(t), "Benki"))
        for d in range(5):
            c.execute("INSERT INTO attendance(student,class_name,date,status) VALUES(?,?,?,?)",
                      (n, cl, str(t - timedelta(days=d)), ["Present", "Present", "Present", "Absent", "Late"][(i + d) % 5]))
    c.execute("INSERT INTO exams(subject,class_name,date,duration,status) VALUES(?,?,?,?,?)", ("Hisabati", "Grade 5-A", str(t + timedelta(days=7)), "Masaa 2", "Scheduled"))
    c.execute("INSERT INTO books(title,author,copies,status) VALUES(?,?,?,?)", ("Kiswahili Sanifu", "TUKI", "12", "Available"))

def init():
    c = sqlite3.connect(DB)
    c.execute("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, role TEXT, name TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY, v TEXT)")
    for t, cols in RES.items():
        c.execute(f"CREATE TABLE IF NOT EXISTS {t}(id INTEGER PRIMARY KEY AUTOINCREMENT, {', '.join(x + ' TEXT' for x in cols)})")
    if not c.execute("SELECT 1 FROM users").fetchone():
        seed(c)
    c.commit(); c.close()

@app.errorhandler(403)
def e403(_): return jsonify(error="Huna ruhusa ya kufanya hili"), 403
@app.errorhandler(404)
def e404(_): return jsonify(error="Haipo"), 404

@app.before_request
def guard():
    if request.path.startswith("/api/") and request.path != "/api/login" and "uid" not in session:
        return jsonify(error="Ingia kwanza"), 401

def school():
    r = db().execute("SELECT v FROM settings WHERE k='school_name'").fetchone()
    return r["v"] if r else "SchoolHub"

def admin_only():
    if session.get("role") != "admin": abort(403)

def check(res, delete=False):
    if res not in RES: abort(404)
    if session["role"] != "admin" and (res in TEACHER_BLOCK or delete): abort(403)

@app.get("/")
def index(): return send_from_directory("public", "index.html")

@app.post("/api/login")
def login():
    d = request.json or {}
    u = db().execute("SELECT * FROM users WHERE username=?", (d.get("username", ""),)).fetchone()
    if not u or not CH(u["password"], d.get("password", "")):
        return jsonify(error="Jina au nenosiri si sahihi"), 401
    session.update(uid=u["id"], role=u["role"])
    return me()

@app.post("/api/logout")
def logout():
    session.clear(); return jsonify(ok=1)

@app.get("/api/me")
def me():
    u = db().execute("SELECT name,role,username FROM users WHERE id=?", (session["uid"],)).fetchone()
    return jsonify(**dict(u), school=school())

@app.post("/api/password")
def password():
    d = request.json or {}
    u = db().execute("SELECT * FROM users WHERE id=?", (session["uid"],)).fetchone()
    if not CH(u["password"], d.get("old", "")): return jsonify(error="Nenosiri la zamani si sahihi"), 400
    if len(d.get("new", "")) < 6: return jsonify(error="Nenosiri liwe na herufi 6 au zaidi"), 400
    db().execute("UPDATE users SET password=? WHERE id=?", (H(d["new"]), u["id"])); db().commit()
    return jsonify(ok=1)

@app.post("/api/settings")
def settings():
    admin_only()
    db().execute("INSERT OR REPLACE INTO settings VALUES('school_name',?)", ((request.json or {}).get("school_name", "SchoolHub"),)); db().commit()
    return jsonify(ok=1)

@app.post("/api/users")
def add_user():
    admin_only(); d = request.json or {}
    if not d.get("username") or len(d.get("password", "")) < 6: return jsonify(error="Jina na nenosiri (herufi 6+) vinahitajika"), 400
    try:
        db().execute("INSERT INTO users(username,password,role,name) VALUES(?,?,?,?)",
                     (d["username"], H(d["password"]), d.get("role") if d.get("role") in ("admin", "teacher") else "teacher", d.get("name", d["username"])))
        db().commit()
    except sqlite3.IntegrityError:
        return jsonify(error="Jina la mtumiaji lipo tayari"), 400
    return jsonify(ok=1), 201

@app.get("/api/stats")
def stats():
    q = lambda s, *a: db().execute(s, a).fetchone()[0] or 0
    tot = q("SELECT COUNT(*) FROM attendance")
    out = dict(
        students=q("SELECT COUNT(*) FROM students WHERE status='Active'"),
        teachers=q("SELECT COUNT(*) FROM teachers"), classes=q("SELECT COUNT(*) FROM classes"),
        rate=round(100 * q("SELECT COUNT(*) FROM attendance WHERE status='Present'") / tot, 1) if tot else 0,
        series=[dict(r) for r in reversed(db().execute(
            "SELECT date, ROUND(100.0*SUM(status='Present')/COUNT(*),1) p FROM attendance GROUP BY date ORDER BY date DESC LIMIT 7").fetchall())],
        events=[dict(r) for r in db().execute("SELECT subject,class_name,date FROM exams WHERE date>=? ORDER BY date LIMIT 4", (str(date.today()),))])
    if session["role"] == "admin":
        f = lambda s: q("SELECT SUM(CAST(amount AS REAL)) FROM fees WHERE status=?", s)
        out["fees"] = dict(paid=f("Paid"), pending=f("Pending"), overdue=f("Overdue"))
    return jsonify(out)

@app.get("/api/<res>")
def lst(res):
    check(res)
    return jsonify([dict(r) for r in db().execute(f"SELECT * FROM {res} ORDER BY id DESC")])

@app.post("/api/<res>")
def add(res):
    check(res); d = request.json or {}; cols = RES[res]
    cur = db().execute(f"INSERT INTO {res}({','.join(cols)}) VALUES({','.join('?' * len(cols))})", [str(d.get(c, "")) for c in cols])
    db().commit(); return jsonify(id=cur.lastrowid), 201

@app.put("/api/<res>/<int:i>")
def upd(res, i):
    check(res); d = request.json or {}; cols = RES[res]
    db().execute(f"UPDATE {res} SET {','.join(c + '=?' for c in cols)} WHERE id=?", [str(d.get(c, "")) for c in cols] + [i])
    db().commit(); return jsonify(ok=1)

@app.delete("/api/<res>/<int:i>")
def rm(res, i):
    check(res, delete=True)
    db().execute(f"DELETE FROM {res} WHERE id=?", (i,)); db().commit(); return jsonify(ok=1)

init()
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)
