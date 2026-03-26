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
  const [showNotes, setShowNotes] = useState(!!task.notes); // Só mostra se tiver conteúdo

  useEffect(() => {
    setLocalNotes(task.notes || "");
  }, [task.notes]);

  return (
    <div
      style={{
        background:
          task.status === "entrada" ? "#e3f2fd" : task.status === "planejamento" ? "#fff3cd" : "#d4edda",
        padding: "8px 12px",
        marginBottom: "8px",
        borderRadius: "8px",
        border: "1px solid #ccc",
        color: "#333",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <strong style={{ color: "#000", fontSize: "0.95rem", display: "block", marginBottom: "4px" }}>
            {task.title}
          </strong>
        </div>
        
        <div style={{ display: "flex", gap: "6px", marginLeft: "8px" }}>
          <button onClick={() => setShowNotes(!showNotes)} title="Ver notas" style={{ cursor: "pointer", border: "none", background: "none", fontSize: "14px" }}>
            {showNotes ? "📖" : "📝"}
          </button>
          <button onClick={() => duplicateTask(task)} title="Duplicar" style={{ cursor: "pointer", border: "none", background: "none", fontSize: "13px" }}>
            📋
          </button>
          <button 
            onClick={() => deleteTask(task.id)} 
            style={{ cursor: "pointer", border: "none", background: "none", color: "#d32f2f", fontSize: "14px", padding: 0 }}
          >
            🗑️
          </button>
        </div>
      </div>

      {showNotes && (
        <textarea
          placeholder="Notas..."
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          onBlur={() => updateNotes(task.id, localNotes)}
          style={{
            marginTop: "6px",
            width: "100%",
            minHeight: "45px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: "4px 6px",
            fontSize: "12px",
            boxSizing: "border-box",
            background: "rgba(255,255,255,0.7)",
            color: "#333",
            resize: "none"
          }}
        />
      )}

      <div style={{ marginTop: "8px", display: "flex", justifyContent: "center", gap: "20px", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "6px" }}>
        <button onClick={() => moveTask(task.id, "left")} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "12px", color: "#666" }}>◀ Mover</button>
        <button onClick={() => moveTask(task.id, "right")} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "12px", color: "#666" }}>Mover ▶</button>
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
      await addDoc(collection(db, "tasks"), { title: title, notes: "", status: "entrada", createdAt: new Date() });
      setTitle("");
    } catch (e) { console.error(e); }
  };

  const duplicateTask = async (task) => {
    const newTitle = window.prompt("Novo título:", `${task.title} (Cópia)`);
    if (!newTitle) return;
    await addDoc(collection(db, "tasks"), { title: newTitle, notes: task.notes, status: task.status, createdAt: new Date() });
  };

  const updateNotes = async (id, value) => { await updateDoc(doc(db, "tasks", id), { notes: value }); };
  const deleteTask = async (id) => { if(window.confirm("Excluir?")) await deleteDoc(doc(db, "tasks", id)); };

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
    <div style={{ flex: "1 1 250px", maxWidth: "350px", padding: "10px", background: "#f4f4f4", borderRadius: "10px", minHeight: "60vh" }}>
      <h2 style={{ fontSize: "0.9rem", textAlign: "center", color: "#555", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>{title}</h2>
      {tasks.filter((t) => t.status === status).map((task) => (
        <TaskCard key={task.id} task={task} updateNotes={updateNotes} deleteTask={deleteTask} moveTask={moveTask} duplicateTask={duplicateTask} />
      ))}
    </div>
  );

  return (
    <div style={{ padding: "15px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", backgroundColor: "#fff", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", fontSize: "1.5rem", color: "#333", marginBottom: "20px" }}>Board de Serviços</h1>

      <div style={{ marginBottom: "25px", display: "flex", justifyContent: "center", gap: "8px" }}>
        <input
          placeholder="Nova OS..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          style={{ padding: "10px", width: "220px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" }}
        />
        <button onClick={addTask} style={{ padding: "10px 18px", background: "#007bff", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
          +
        </button>
      </div>

      <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", justifyContent: "center" }}>
        <Column title="Entrada" status="entrada" />
        <Column title="Planejamento" status="planejamento" />
        <Column title="Pronto" status="pronto" />
      </div>
    </div>
  );
}