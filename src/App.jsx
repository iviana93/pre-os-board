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
        padding: "12px",
        marginBottom: "12px",
        borderRadius: "8px",
        border: "1px solid #999",
        color: "#000", // Força texto preto
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ color: "#000", fontSize: "1rem", flex: 1, fontWeight: "bold" }}>
          {task.title}
        </strong>
        
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={() => setShowNotes(!showNotes)} style={{ cursor: "pointer", border: "1px solid #999", background: "#eee", borderRadius: "4px", padding: "2px 6px", color: "#000" }}>
            {showNotes ? "🔼" : "📝"}
          </button>
          <button onClick={() => duplicateTask(task)} style={{ cursor: "pointer", border: "none", background: "none", fontSize: "16px", color: "#000" }}>📋</button>
          
          {task.status === "pronto" && (
            <button 
              onClick={() => archiveTask(task.id)} 
              style={{ cursor: "pointer", border: "none", background: "#28a745", color: "#fff", borderRadius: "4px", padding: "4px 8px", fontSize: "12px", fontWeight: "bold" }}
            >
              ✅
            </button>
          )}

          <button onClick={() => deleteTask(task.id)} style={{ cursor: "pointer", border: "none", background: "none", color: "#d32f2f", fontSize: "18px" }}>🗑️</button>
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
            border: "1px solid #888",
            borderRadius: "4px",
            padding: "8px",
            fontSize: "14px",
            boxSizing: "border-box",
            background: "#fff",
            color: "#000" // Texto da nota sempre preto
          }}
        />
      )}

      <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(0,0,0,0.2)", paddingTop: "10px" }}>
        <button 
            onClick={() => moveTask(task.id, "left")} 
            disabled={task.status === "entrada"}
            style={{ 
              border: "1px solid #444", 
              background: "#fff", 
              borderRadius: "4px", 
              padding: "6px 15px", 
              cursor: "pointer", 
              fontSize: "18px", 
              color: "#000", // Força a seta a ser preta
              fontWeight: "bold",
              visibility: task.status === "entrada" ? "hidden" : "visible" 
            }}
        >
            ←
        </button>
        <button 
            onClick={() => moveTask(task.id, "right")} 
            disabled={task.status === "pronto"}
            style={{ 
              border: "1px solid #444", 
              background: "#fff", 
              borderRadius: "4px", 
              padding: "6px 15px", 
              cursor: "pointer", 
              fontSize: "18px", 
              color: "#000", // Força a seta a ser preta
              fontWeight: "bold",
              visibility: task.status === "pronto" ? "hidden" : "visible"
            }}
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
    <div style={{ flex: "1 1 300px", maxWidth: "400px", padding: "12px", background: "#f0f0f0", borderRadius: "10px", minHeight: "60vh", border: "1px solid #ccc" }}>
      <h2 style={{ fontSize: "1rem", textAlign: "center", color: "#000", textTransform: "uppercase", marginBottom: "15px", fontWeight: "bold" }}>
        {icon} {title} ({tasks.filter(t => t.status === status).length})
      </h2>
      {tasks.filter((t) => t.status === status).map((task) => (
        <TaskCard 
          key={task.id} 
          task={task} 
          archiveTask={archiveTask} 
          moveTask={moveTask} 
          deleteTask={(id) => window.confirm("Excluir?") && deleteDoc(doc(db, "tasks", id))} 
          updateNotes={(id, n) => updateDoc(doc(db, "tasks", id), {notes: n})} 
          duplicateTask={async (t) => addDoc(collection(db, "tasks"), {...t, title: t.title + " (Cópia)", createdAt: new Date()})} 
        />
      ))}
    </div>
  );

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", backgroundColor: "#ffffff", minHeight: "100vh", color: "#000000" }}>
      <h1 style={{ textAlign: "center", fontSize: "1.8rem", marginBottom: "25px", color: "#000000", fontWeight: "bold" }}>
        GERENCIADOR DE OS
      </h1>

      <div style={{ marginBottom: "30px", display: "flex", justifyContent: "center", gap: "10px" }}>
        <input 
          placeholder="Nova OS..." 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          onKeyDown={(e) => e.key === "Enter" && addTask()} 
          style={{ padding: "12px", width: "250px", borderRadius: "6px", border: "2px solid #000", background: "#fff", color: "#000", fontSize: "16px" }} 
        />
        <button onClick={addTask} style={{ padding: "12px 25px", background: "#000", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}>
          CRIAR
        </button>
      </div>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
        <Column title="Entrada" status="entrada" icon="📥" />
        <Column title="Planejamento" status="planejamento" icon="⚙️" />
        <Column title="Pronto para OS" status="pronto" icon="📄" />
      </div>

      <div style={{ marginTop: "60px", borderTop: "3px solid #000", paddingTop: "30px", paddingBottom: "50px" }}>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          style={{ display: "block", margin: "0 auto", padding: "12px 30px", background: "#333", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
        >
          {showHistory ? "OCULTAR HISTÓRICO" : "VER OS CONCLUÍDAS (HISTÓRICO)"}
        </button>

        {showHistory && (
          <div style={{ maxWidth: "900px", margin: "25px auto", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #000" }}>
              <thead>
                <tr style={{ background: "#000", color: "#fff", textAlign: "left" }}>
                  <th style={{ padding: "12px" }}>Título</th>
                  <th style={{ padding: "12px" }}>Finalizado em</th>
                  <th style={{ padding: "12px" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {tasks.filter(t => t.status === "arquivado").map(task => (
                  <tr key={task.id} style={{ borderBottom: "1px solid #ccc" }}>
                    <td style={{ padding: "12px", color: "#000", fontWeight: "bold" }}>{task.title}</td>
                    <td style={{ padding: "12px", fontSize: "0.9rem", color: "#333" }}>
                      {task.finishedAt?.toDate().toLocaleDateString("pt-BR")}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <button onClick={() => updateDoc(doc(db, "tasks", task.id), {status: "pronto"})} style={{ marginRight: "10px", cursor: "pointer", background: "#fff", border: "1px solid #000", padding: "4px 8px", color: "#000" }}>Restaurar</button>
                      <button onClick={() => deleteDoc(doc(db, "tasks", task.id))} style={{ color: "red", cursor: "pointer", background: "#fff", border: "1px solid red", padding: "4px 8px" }}>Apagar</button>
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