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

function TaskCard({ task, updateNotes, deleteTask, moveTask, duplicateTask, archiveTask, renameTask }) {
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
        padding: "8px 10px", // Padding reduzido
        marginBottom: "8px",
        borderRadius: "6px",
        border: "1px solid #aaa",
        color: "#000",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <strong style={{ color: "#000", fontSize: "0.85rem", fontWeight: "bold", display: "inline-block", marginRight: "4px" }}>
            {task.title}
          </strong>
          <button 
            onClick={() => renameTask(task.id, task.title)}
            style={{ border: "none", background: "none", cursor: "pointer", fontSize: "10px", padding: 0 }}
          >
            ✏️
          </button>
        </div>
        
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <button onClick={() => setShowNotes(!showNotes)} style={{ cursor: "pointer", border: "1px solid #999", background: "#eee", borderRadius: "3px", padding: "1px 4px", fontSize: "10px", color: "#000" }}>
            {showNotes ? "🔼" : "📝"}
          </button>
          
          <button onClick={() => duplicateTask(task)} style={{ cursor: "pointer", border: "none", background: "none", fontSize: "14px" }}>
            📋
          </button>
          
          {task.status === "pronto" && (
            <button 
              onClick={() => archiveTask(task.id)} 
              style={{ cursor: "pointer", border: "none", background: "#28a745", color: "#fff", borderRadius: "3px", padding: "2px 5px", fontSize: "10px", fontWeight: "bold" }}
            >
              ✅
            </button>
          )}

          <button onClick={() => deleteTask(task.id)} style={{ cursor: "pointer", border: "none", background: "none", color: "#d32f2f", fontSize: "14px" }}>
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
            minHeight: "60px",
            border: "1px solid #999",
            borderRadius: "4px",
            padding: "6px",
            fontSize: "12px", // Fonte das notas menor
            boxSizing: "border-box",
            background: "#fff",
            color: "#000",
            resize: "vertical"
          }}
        />
      )}

      <div style={{ marginTop: "8px", display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "6px" }}>
        <button 
            onClick={() => moveTask(task.id, "left")} 
            style={{ 
              border: "1px solid #666", background: "#fff", borderRadius: "3px", padding: "2px 10px", 
              cursor: "pointer", fontSize: "14px", color: "#000", fontWeight: "bold",
              visibility: task.status === "entrada" ? "hidden" : "visible" 
            }}
        > ← </button>
        <button 
            onClick={() => moveTask(task.id, "right")} 
            style={{ 
              border: "1px solid #666", background: "#fff", borderRadius: "3px", padding: "2px 10px", 
              cursor: "pointer", fontSize: "14px", color: "#000", fontWeight: "bold",
              visibility: task.status === "pronto" ? "hidden" : "visible"
            }}
        > → </button>
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

  const renameTask = async (id, currentTitle) => {
    const newTitle = window.prompt("Editar nome:", currentTitle);
    if (newTitle && newTitle.trim() !== "") {
      await updateDoc(doc(db, "tasks", id), { title: newTitle });
    }
  };

  const duplicateTask = async (task) => {
    const newTitle = window.prompt("Nome da cópia:", `${task.title} (Cópia)`);
    if (newTitle && newTitle.trim() !== "") {
      await addDoc(collection(db, "tasks"), { title: newTitle, notes: task.notes, status: task.status, createdAt: new Date() });
    }
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
    <div style={{ flex: "1 1 250px", maxWidth: "350px", padding: "10px", background: "#f5f5f5", borderRadius: "8px", minHeight: "60vh", border: "1px solid #ccc" }}>
      <h2 style={{ fontSize: "0.85rem", textAlign: "center", color: "#333", textTransform: "uppercase", marginBottom: "12px", fontWeight: "bold" }}>
        {icon} {title} ({tasks.filter(t => t.status === status).length})
      </h2>
      {tasks.filter((t) => t.status === status).map((task) => (
        <TaskCard 
          key={task.id} 
          task={task} 
          archiveTask={archiveTask} 
          moveTask={moveTask} 
          renameTask={renameTask}
          duplicateTask={duplicateTask}
          deleteTask={(id) => window.confirm("Excluir?") && deleteDoc(doc(db, "tasks", id))} 
          updateNotes={(id, n) => updateDoc(doc(db, "tasks", id), {notes: n})} 
        />
      ))}
    </div>
  );

  return (
    <div style={{ padding: "15px", fontFamily: "sans-serif", backgroundColor: "#ffffff", minHeight: "100vh", color: "#000000" }}>
      <h1 style={{ textAlign: "center", fontSize: "1.4rem", marginBottom: "20px", color: "#000", fontWeight: "bold" }}>
        GERENCIADOR DE OS
      </h1>

      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center", gap: "8px" }}>
        <input 
          placeholder="Nova OS..." 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          onKeyDown={(e) => e.key === "Enter" && addTask()} 
          style={{ padding: "8px 12px", width: "200px", borderRadius: "4px", border: "1px solid #000", background: "#fff", color: "#000", fontSize: "14px" }} 
        />
        <button onClick={addTask} style={{ padding: "8px 16px", background: "#000", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>
          +
        </button>
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <Column title="Entrada" status="entrada" icon="📥" />
        <Column title="Planejamento" status="planejamento" icon="⚙️" />
        <Column title="Pronto" status="pronto" icon="📄" />
      </div>

      <div style={{ marginTop: "40px", borderTop: "2px solid #ddd", paddingTop: "20px" }}>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          style={{ display: "block", margin: "0 auto", padding: "8px 20px", background: "#444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
        >
          {showHistory ? "OCULTAR HISTÓRICO" : "VER HISTÓRICO"}
        </button>

        {showHistory && (
          <div style={{ maxWidth: "800px", margin: "20px auto", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #ddd", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#eee", color: "#000", textAlign: "left" }}>
                  <th style={{ padding: "10px" }}>Título</th>
                  <th style={{ padding: "10px" }}>Finalizado</th>
                  <th style={{ padding: "10px" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {tasks.filter(t => t.status === "arquivado").map(task => (
                  <tr key={task.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "10px", color: "#000" }}>{task.title}</td>
                    <td style={{ padding: "10px", color: "#666" }}>
                      {task.finishedAt?.toDate().toLocaleDateString("pt-BR")}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <button onClick={() => updateDoc(doc(db, "tasks", task.id), {status: "pronto"})} style={{ marginRight: "5px", cursor: "pointer", background: "#fff", border: "1px solid #ccc", padding: "2px 5px", fontSize: "11px" }}>Restaurar</button>
                      <button onClick={() => deleteDoc(doc(db, "tasks", task.id))} style={{ color: "red", cursor: "pointer", background: "none", border: "1px solid red", fontSize: "11px", padding: "2px 5px" }}>Apagar</button>
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