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

function TaskCard({ task, updateNotes, deleteTask, moveTask, duplicateTask, archiveTask }) {
  const [localNotes, setLocalNotes] = useState(task.notes || "");
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
          <button onClick={() => setShowNotes(!showNotes)} style={{ cursor: "pointer", border: "none", background: "#eee", borderRadius: "4px", padding: "2px 5px" }}>
            {showNotes ? "🔼" : "📝"}
          </button>
          <button onClick={() => duplicateTask(task)} style={{ cursor: "pointer", border: "none", background: "none", fontSize: "14px" }}>📋</button>
          
          {/* BOTÃO CONCLUIR: Só aparece na última coluna */}
          {task.status === "pronto" && (
            <button 
              onClick={() => archiveTask(task.id)} 
              title="Finalizar e mover para histórico"
              style={{ cursor: "pointer", border: "none", background: "#28a745", color: "#fff", borderRadius: "4px", padding: "2px 6px", fontSize: "12px", fontWeight: "bold" }}
            >
              ✅
            </button>
          )}

          <button onClick={() => deleteTask(task.id)} style={{ cursor: "pointer", border: "none", background: "none", color: "#d32f2f", fontSize: "14px" }}>🗑️</button>
        </div>
      </div>

      {showNotes && (
        <textarea
          placeholder="Notas..."
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
            color: "#000"
          }}
        />
      )}

      <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "8px" }}>
        <button 
            onClick={() => moveTask(task.id, "left")} 
            disabled={task.status === "entrada"}
            style={{ border: "1px solid #ccc", background: "#fff", borderRadius: "4px", padding: "4px 12px", cursor: "pointer", opacity: task.status === "entrada" ? 0.3 : 1 }}
        >
            ←
        </button>
        <button 
            onClick={() => moveTask(task.id, "right")} 
            disabled={task.status === "pronto"}
            style={{ border: "1px solid #ccc", background: "#fff", borderRadius: "4px", padding: "4px 12px", cursor: "pointer", opacity: task.status === "pronto" ? 0.3 : 1 }}
        >
            →
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTasks(taskList);
    });
    return () => unsub();
  }, []);

  const addTask = async () => {
    if (!title.trim()) return;
    await addDoc(collection(db, "tasks"), { title, notes: "", status: "entrada", createdAt: new Date() });
    setTitle("");
  };

  const archiveTask = async (id) => {
    await updateDoc(doc(db, "tasks", id), { status: "arquivado", finishedAt: new Date() });
  };

  const moveTask = async (id, direction) => {
    const task = tasks.find((t) => t.id === id);
    let newStatus = task.status;
    if (direction === "right") {
      if (task.status === "entrada") newStatus = "planejamento";
      else if (task.status === "planejamento") newStatus = "pronto";
    } else {
      if (task.status === "pronto") newStatus = "planejamento";
      else if (task.status === "planejamento") newStatus = "entrada";
    }
    await updateDoc(doc(db, "tasks", id), { status: newStatus });
  };

  const Column = ({ title, status, icon }) => (
    <div style={{ flex: "1 1 300px", maxWidth: "400px", padding: "12px", background: "#eee", borderRadius: "10px", minHeight: "60vh" }}>
      <h2 style={{ fontSize: "0.85rem", textAlign: "center", color: "#666", textTransform: "uppercase", marginBottom: "15px" }}>
        {icon} {title} ({tasks.filter(t => t.status === status).length})
      </h2>
      {tasks.filter((t) => t.status === status).map((task) => (
        <TaskCard key={task.id} task={task} archiveTask={archiveTask} moveTask={moveTask} deleteTask={(id) => deleteDoc(doc(db, "tasks", id))} updateNotes={(id, n) => updateDoc(doc(db, "tasks", id), {notes: n})} duplicateTask={async (t) => addDoc(collection(db, "tasks"), {...t, title: t.title + " (Cópia)", createdAt: new Date()})} />
      ))}
    </div>
  );

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", backgroundColor: "#fff", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", fontSize: "1.6rem", marginBottom: "20px" }}>Gerenciador de OS</h1>

      <div style={{ marginBottom: "30px", display: "flex", justifyContent: "center", gap: "10px" }}>
        <input placeholder="Nova OS..." value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} style={{ padding: "12px", width: "250px", borderRadius: "6px", border: "1px solid #bbb" }} />
        <button onClick={addTask} style={{ padding: "12px 20px", background: "#28a745", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>CRIAR</button>
      </div>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
        <Column title="Entrada" status="entrada" icon="📥" />
        <Column title="Planejamento" status="planejamento" icon="⚙️" />
        <Column title="Pronto para OS" status="pronto" icon="📄" />
      </div>

      {/* SEÇÃO DE HISTÓRICO */}
      <div style={{ marginTop: "50px", borderTop: "2px solid #eee", paddingTop: "20px" }}>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          style={{ display: "block", margin: "0 auto", padding: "10px 20px", background: "#6c757d", color: "#fff", border: "none", borderRadius: "20px", cursor: "pointer" }}
        >
          {showHistory ? "Ocultar Histórico" : "Ver OS Concluídas (Histórico)"}
        </button>

        {showHistory && (
          <div style={{ maxWidth: "800px", margin: "20px auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#f9f9f9" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
                  <th style={{ padding: "10px" }}>Título</th>
                  <th style={{ padding: "10px" }}>Finalizado em</th>
                  <th style={{ padding: "10px" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {tasks.filter(t => t.status === "arquivado").map(task => (
                  <tr key={task.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "10px" }}>{task.title}</td>
                    <td style={{ padding: "10px", fontSize: "0.8rem", color: "#666" }}>
                      {task.finishedAt?.toDate().toLocaleDateString("pt-BR")}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <button onClick={() => updateDoc(doc(db, "tasks", task.id), {status: "pronto"})} style={{ marginRight: "10px", cursor: "pointer", background: "none", border: "1px solid #ccc", fontSize: "10px" }}>Restaurar</button>
                      <button onClick={() => deleteDoc(doc(db, "tasks", task.id))} style={{ color: "red", cursor: "pointer", background: "none", border: "1px solid red", fontSize: "10px" }}>Apagar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}