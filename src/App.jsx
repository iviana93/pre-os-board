import React, { useState, useEffect } from "react";
import { db } from "./firebase"; 
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from "firebase/firestore";

function TaskCard({ task, updateNotes, deleteTask, moveTask, duplicateTask }) {
  const [localNotes, setLocalNotes] = useState(task.notes || "");
  // Mudança aqui: Começa sempre fechado para manter o board limpo
  const [showNotes, setShowNotes] = useState(false); 

  useEffect(() => {
    setLocalNotes(task.notes || "");
  }, [task.notes]);

  return (
    <div
      style={{
        background:
          task.status === "entrada" ? "#e3f2fd" : task.status === "planejamento" ? "#fff3cd" : "#d4edda",
        padding: "10px",
        marginBottom: "10px",
        borderRadius: "8px",
        border: "1px solid #bbb",
        color: "#333",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ color: "#000", fontSize: "0.95rem", flex: 1 }}>
          {task.title}
        </strong>
        
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button 
            onClick={() => setShowNotes(!showNotes)} 
            style={{ cursor: "pointer", border: "none", background: "#eee", borderRadius: "4px", padding: "2px 5px", fontSize: "12px" }}
          >
            {showNotes ? "🔼" : "📝"}
          </button>
          <button 
            onClick={() => duplicateTask(task)} 
            style={{ cursor: "pointer", border: "none", background: "none", fontSize: "14px" }}
          >
            📋
          </button>
          <button 
            onClick={() => deleteTask(task.id)} 
            style={{ cursor: "pointer", border: "none", background: "none", color: "#d32f2f", fontSize: "14px" }}
          >
            🗑️
          </button>
        </div>
      </div>

      {showNotes && (
        <textarea
          placeholder="Escreva os detalhes aqui..."
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          onBlur={() => updateNotes(task.id, localNotes)}
          style={{
            marginTop: "10px",
            width: "100%",
            minHeight: "80px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "8px",
            fontSize: "13px",
            boxSizing: "border-box",
            background: "#fff",
            color: "#000",
            resize: "vertical"
          }}
        />
      )}

      <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "8px" }}>
        <button onClick={() => moveTask(task.id, "left")} style={{ border: "1px solid #ccc", background: "#fff", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "11px" }}>◀ Voltar</button>
        <button onClick={() => moveTask(task.id, "right")} style={{ border: "1px solid #ccc", background: "#fff", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "11px" }}>Avançar ▶</button>
      </div>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTasks(taskList);
    });
    return () => unsub();
  }, []);

  const addTask = async () => {
    if (!title.trim()) return;
    try {
      await addDoc(collection(db, "tasks"), { 
        title: title, 
        notes: "", 
        status: "entrada", 
        createdAt: new Date() 
      });
      setTitle("");
    } catch (e) { console.error(e); }
  };

  const duplicateTask = async (task) => {
    const newTitle = window.prompt("Título da cópia:", `${task.title} (Cópia)`);
    if (!newTitle) return;
    await addDoc(collection(db, "tasks"), { 
      title: newTitle, 
      notes: task.notes, 
      status: task.status, 
      createdAt: new Date() 
    });
  };

  const updateNotes = async (id, value) => { await updateDoc(doc(db, "tasks", id), { notes: value }); };
  const deleteTask = async (id) => { if(window.confirm("Excluir definitivamente?")) await deleteDoc(doc(db, "tasks", id)); };

  const moveTask = async (id, direction) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    let newStatus = task.status;
    if (direction === "right") {
      if (task.status === "entrada") newStatus = "planejamento";
      else if (task.status === "planejamento") newStatus = "pronto";
    } else if (direction === "left") {
      if (task.status === "planejamento") newStatus = "entrada";
      else if (task.status === "pronto") newStatus = "planejamento";
    }
    await updateDoc(doc(db, "tasks", id), { status: newStatus });
  };

  const Column = ({ title, status }) => (
    <div style={{ flex: "1 1 300px", maxWidth: "400px", padding: "12px", background: "#eee", borderRadius: "10px", minHeight: "70vh" }}>
      <h2 style={{ fontSize: "0.85rem", textAlign: "center", color: "#666", textTransform: "uppercase", marginBottom: "15px", fontWeight: "bold" }}>{title}</h2>
      {tasks.filter((t) => t.status === status).map((task) => (
        <TaskCard 
          key={task.id} // CRITICAL: Usar o ID do Firebase mantém o estado correto
          task={task} 
          updateNotes={updateNotes} 
          deleteTask={deleteTask} 
          moveTask={moveTask} 
          duplicateTask={duplicateTask} 
        />
      ))}
    </div>
  );

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", backgroundColor: "#fff", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", fontSize: "1.6rem", color: "#222", marginBottom: "30px" }}>Gerenciador de OS</h1>

      <div style={{ marginBottom: "30px", display: "flex", justifyContent: "center", gap: "10px" }}>
        <input
          placeholder="Nome do cliente ou serviço..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          style={{ padding: "12px", width: "280px", borderRadius: "6px", border: "1px solid #bbb", fontSize: "15px", color: "#000", background: "#fff" }}
        />
        <button onClick={addTask} style={{ padding: "12px 20px", background: "#28a745", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
          CRIAR
        </button>
      </div>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
        <Column title="📥 Entrada" status="entrada" />
        <Column title="⚙️ Planejamento" status="planejamento" />
        <Column title="✅ Pronto para OS" status="pronto" />
      </div>
    </div>
  );
}