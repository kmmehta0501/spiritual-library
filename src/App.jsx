import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import {
  BookOpen, Search, Upload, LogIn, LogOut, Plus, X, Download,
  Eye, Trash2, Edit3, Sparkles, Languages, LibraryBig
} from "lucide-react";

const ADMIN_EMAILS = ["kmmehta0501@gmail.com"];

const categories = [
  "All", "Rajyoga", "Meditation", "Soul Consciousness", "Karma",
  "Godly Knowledge", "Positive Thinking", "Relationships", "Children", "General"
];

const emptyForm = {
  title: "", author: "", description: "", category: "General",
  language: "English", pages: "", coverFile: null, pdfFile: null
};

function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("All");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [user, setUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [notice, setNotice] = useState("");

  const isAdmin = !!user && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    loadBooks();
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadBooks() {
    setLoading(true);
    const { data, error } = await supabase.from("books").select("*").order("created_at", { ascending: false });
    if (error) setNotice(error.message);
    else setBooks(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => books.filter(b => {
    const text = `${b.title} ${b.author || ""} ${b.description || ""}`.toLowerCase();
    return text.includes(query.toLowerCase())
      && (language === "All" || b.language === language)
      && (category === "All" || b.category === category);
  }), [books, query, language, category]);

  async function login(e) {
    e.preventDefault();
    setNotice("");
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail, password: loginPassword
    });
    if (error) setNotice(error.message);
    else { setLoginEmail(""); setLoginPassword(""); }
  }

  async function logout() {
    await supabase.auth.signOut();
    setAdminOpen(false);
  }

  function startAdd() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function startEdit(book) {
    setEditing(book);
    setForm({
      title: book.title, author: book.author || "", description: book.description || "",
      category: book.category || "General", language: book.language || "English",
      pages: book.pages || "", coverFile: null, pdfFile: null
    });
    setFormOpen(true);
  }

  async function uploadFile(file, prefix) {
    if (!file) return null;
    const ext = file.name.split(".").pop();
    const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("books").upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("books").getPublicUrl(path);
    return data.publicUrl;
  }

  async function saveBook(e) {
    e.preventDefault();
    if (!isAdmin) return;
    setNotice("Saving...");
    try {
      let cover_url = editing?.cover_url || null;
      let pdf_url = editing?.pdf_url || null;
      if (form.coverFile) cover_url = await uploadFile(form.coverFile, "covers");
      if (form.pdfFile) pdf_url = await uploadFile(form.pdfFile, "pdfs");
      if (!pdf_url) throw new Error("Please select a PDF.");

      const payload = {
        title: form.title.trim(), author: form.author.trim(), description: form.description.trim(),
        category: form.category, language: form.language,
        cover_url, pdf_url, pages: form.pages ? Number(form.pages) : null
      };

      if (editing) {
        const { error } = await supabase.from("books").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("books").insert(payload);
        if (error) throw error;
      }
      setFormOpen(false);
      setForm(emptyForm);
      setNotice("Book saved successfully.");
      await loadBooks();
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function deleteBook(book) {
    if (!isAdmin || !confirm(`Delete "${book.title}"?`)) return;
    const { error } = await supabase.from("books").delete().eq("id", book.id);
    if (error) setNotice(error.message);
    else { setNotice("Book deleted."); await loadBooks(); }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand" onClick={() => window.scrollTo({top:0, behavior:"smooth"})}>
          <div className="logo"><LibraryBig size={24}/></div>
          <div><strong>Spiritual Library</strong><span>A Journey Within</span></div>
        </div>
        <div className="header-actions">
          <button className="ghost" onClick={() => setAdminOpen(true)}>
            <LogIn size={17}/> Admin
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow"><Sparkles size={15}/> SPIRITUAL STUDY LIBRARY</div>
            <h1>Explore wisdom.<br/><em>Discover the self.</em></h1>
            <p>A peaceful digital collection of spiritual books inspired by Brahma Kumaris knowledge, meditation and self-transformation.</p>
            <div className="search">
              <Search size={20}/>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search books, topics, authors..." />
            </div>
          </div>
        </section>

        <section className="library">
          <div className="section-head">
            <div><h2>Book Collection</h2><p>{filtered.length} book{filtered.length !== 1 ? "s" : ""} available</p></div>
            <div className="filters">
              <select value={language} onChange={e => setLanguage(e.target.value)}>
                <option>All</option><option>English</option><option>Hindi</option><option>Gujarati</option>
              </select>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {loading ? <div className="empty">Loading the library...</div> :
            filtered.length === 0 ? <div className="empty">No books found. Try another search or filter.</div> :
            <div className="grid">{filtered.map(book => (
              <article className="card" key={book.id}>
                <div className="cover" onClick={() => setSelected(book)}>
                  {book.cover_url ? <img src={book.cover_url} alt={book.title}/> :
                    <div className="cover-placeholder"><BookOpen size={42}/><span>Spiritual<br/>Library</span></div>}
                  <span className="lang">{book.language}</span>
                </div>
                <div className="card-body">
                  <small>{book.category}</small>
                  <h3>{book.title}</h3>
                  <p>{book.author || "Spiritual Library"}</p>
                  <button className="read-btn" onClick={() => setSelected(book)}><Eye size={16}/> Read Book</button>
                </div>
              </article>
            ))}</div>}
        </section>
      </main>

      <footer>
        <BookOpen size={18}/> Spiritual Library · A space for study, reflection and inner transformation
      </footer>

      {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}>
        <div className="book-modal" onClick={e => e.stopPropagation()}>
          <button className="close" onClick={() => setSelected(null)}><X/></button>
          <div className="modal-cover">
            {selected.cover_url ? <img src={selected.cover_url} alt={selected.title}/> : <div className="cover-placeholder"><BookOpen size={50}/></div>}
          </div>
          <div className="modal-info">
            <span className="tag">{selected.category} · {selected.language}</span>
            <h2>{selected.title}</h2>
            <p className="author">{selected.author || "Spiritual Library"}</p>
            <p>{selected.description || "A spiritual study resource for reflection and self-transformation."}</p>
            {selected.pages && <p className="meta">{selected.pages} pages</p>}
            <div className="modal-actions">
              <a className="primary" href={selected.pdf_url} target="_blank" rel="noreferrer"><Eye size={17}/> Read Online</a>
              <a className="secondary" href={selected.pdf_url} download><Download size={17}/> Download PDF</a>
            </div>
          </div>
        </div>
      </div>}

      {adminOpen && <div className="modal-backdrop" onClick={() => setAdminOpen(false)}>
        <div className="admin-modal" onClick={e => e.stopPropagation()}>
          <button className="close" onClick={() => setAdminOpen(false)}><X/></button>
          {!user ? <form onSubmit={login}>
            <h2>Admin Login</h2><p>Sign in to manage your book collection.</p>
            <input required type="email" placeholder="Admin email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}/>
            <input required type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}/>
            <button className="primary full"><LogIn size={17}/> Sign In</button>
          </form> : !isAdmin ? <div><h2>Access denied</h2><p>This account is not configured as a library administrator.</p><button className="secondary" onClick={logout}><LogOut size={16}/> Sign out</button></div> :
          <div>
            <div className="admin-title"><div><h2>Admin Dashboard</h2><p>{books.length} books in library</p></div><button className="primary" onClick={startAdd}><Plus size={17}/> Add Book</button></div>
            <div className="admin-list">{books.map(b => <div className="admin-row" key={b.id}>
              <div><strong>{b.title}</strong><span>{b.language} · {b.category}</span></div>
              <div className="row-actions"><button onClick={() => startEdit(b)}><Edit3 size={16}/></button><button onClick={() => deleteBook(b)}><Trash2 size={16}/></button></div>
            </div>)}</div>
            <button className="secondary" onClick={logout}><LogOut size={16}/> Sign out</button>
          </div>}
        </div>
      </div>}

      {formOpen && <div className="modal-backdrop" onClick={() => setFormOpen(false)}>
        <form className="admin-modal form" onClick={e => e.stopPropagation()} onSubmit={saveBook}>
          <button type="button" className="close" onClick={() => setFormOpen(false)}><X/></button>
          <h2>{editing ? "Edit Book" : "Add New Book"}</h2>
          <input required placeholder="Book title *" value={form.title} onChange={e => setForm({...form,title:e.target.value})}/>
          <input placeholder="Author / source" value={form.author} onChange={e => setForm({...form,author:e.target.value})}/>
          <textarea placeholder="Description" rows="4" value={form.description} onChange={e => setForm({...form,description:e.target.value})}/>
          <div className="two"><select value={form.category} onChange={e => setForm({...form,category:e.target.value})}>{categories.slice(1).map(c=><option key={c}>{c}</option>)}</select>
          <select value={form.language} onChange={e => setForm({...form,language:e.target.value})}><option>English</option><option>Hindi</option><option>Gujarati</option></select></div>
          <input type="number" min="1" placeholder="Number of pages" value={form.pages} onChange={e => setForm({...form,pages:e.target.value})}/>
          <label>Book cover <input type="file" accept="image/*" onChange={e => setForm({...form,coverFile:e.target.files[0]})}/></label>
          <label>PDF file * <input type="file" accept="application/pdf" required={!editing} onChange={e => setForm({...form,pdfFile:e.target.files[0]})}/></label>
          <button className="primary full"><Upload size={17}/> {editing ? "Save Changes" : "Upload Book"}</button>
        </form>
      </div>}

      {notice && <div className="toast" onClick={() => setNotice("")}>{notice}</div>}
    </div>
  );
}

export default App;
