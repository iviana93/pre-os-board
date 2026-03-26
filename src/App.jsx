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

// Componente de cada cartão de tarefa
function TaskCard({ task, updateNotes, deleteTask, moveTask, duplicateTask }) {
  const [localNotes, setLocalNotes] = useState(task.notes || "");

  useEffect(() => {
    setLocalNotes(task.notes || "");
  }, [task.notes]);

  return (
    <div
      style={{
        background:
          task.status === "entrada"
            ? "#e3f2fd"
            : task.status === "planejamento"
            ? "#fff3cd"
            : "#d4edda",
        padding: 10,
        marginBottom: 10,
        borderRadius: 6,
        border: "1px solid #ccc",
        color: "#333",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)", // Sombra leve para destacar
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ color: "#000", fontSize: "1rem" }}>{task.title}</strong>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* BOTÃO DUPLICAR (📋) - Cor neutra */}
          <button 
            onClick={() => duplicateTask(task)} 
            title="Duplicar tarefa"
            style={{ 
              cursor: "pointer", 
              border: "none", 
              background: "none", 
              fontSize: "14px", 
              padding: 0, 
              color: "#555" // Cinza escuro para a prancheta
            }}
          >
            📋
          </button>
          
          {/* BOTÃO DELETAR (🗑️) - Cor VERMELHA sólida */}
          <button 
            onClick={() => deleteTask(task.id)} 
            title="Excluir tarefa"
            style={{ 
              cursor: "pointer", 
              border: "1px solid #ff4444", // Borda vermelha leve
              background: "#fff", // Fundo branco para destacar
              color: "#ff0000", // Ícone da lixeira em VERMELHO
              fontSize: "16px", 
              padding: "4px 6px", // Espaçamento
              borderRadius: "4px", // Cantos arredondados
              boxSizing: "border-box"
            }}
          >
            🗑️
          </button>
        </div>
      </div>

      <textarea
        placeholder="Clique aqui e escreva..."
        value={localNotes}
        onChange={(e) => setLocalNotes(e.target.value)}
        onBlur={() => updateNotes(task.id, localNotes)}
        style={{
          marginTop: 8,
          width: "100%",
          minHeight: "60px",
          border: "1px solid #bbb",
          borderRadius: 4,
          padding: 8,
          fontSize: 14,
          boxSizing: "border-box",
          background: "#fff",
          color: "#333",
          resize: "vertical" // Permite redimensionar verticalmente
        }}
      />

      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between" }}>
        <button onClick={() => moveTask(task.id, "left")} style={{ padding: "4px 10px", cursor: "pointer" }}>◀</button>
        <button onClick={() => moveTask(task.id, "right")} style={{ padding: "4px 10px", cursor: "pointer" }}>▶</button>
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
      const taskList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
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
        createdAt: new Date(),
      });
      setTitle("");
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const duplicateTask = async (task) => {
    const newTitle = window.prompt("Novo título para a cópia:", `${task.title} (Cópia)`);
    if (newTitle === null) return;
    try {
      await addDoc(collection(db, "tasks"), {
        title: newTitle || task.title, 
        notes: task.notes,
        status: task.status, 
        createdAt: new Date(), 
      });
    } catch (error) {
      console.error("Erro ao duplicar:", error);
    }
  };

  const updateNotes = async (id, value) => {
    try {
      await updateDoc(doc(db, "tasks", id), { notes: value });
    } catch (error) {
      console.error(error);
    }
  };

  const deleteTask = async (id) => {
    if(window.confirm("Excluir esta tarefa permanentemente?")) {
      await deleteDoc(doc(db, "tasks", id));
    }
  };

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
    <div style={{ flex: "1 1 300px", padding: 10, background: "#f0f0f0", borderRadius: 8, minHeight: "70vh", boxSizing: "border-box" }}>
      <h2 style={{ fontSize: "1.1rem", textAlign: "center", color: "#333", marginBottom: 15, borderBottom: "2px solid #ddd", paddingBottom: "5px" }}>{title}</h2>
      {tasks
        .filter((t) => t.status === status)
        .map((task) => (
          <TaskCard
            key={task.id}
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
    <div style={{ padding: "20px", fontFamily: "sans-serif", backgroundColor: "#fff", minHeight: "100vh", color: "#222" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>Pre-OS Board (Firebase)</h1>

      <div style={{ marginBottom: 30, textAlign: "center" }}>
        <input
          placeholder="Título da nova ordem de serviço..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          style={{ 
            padding: "12px", 
            marginRight: "10px", 
            width: "300px", 
            borderRadius: "4px", 
            border: "1px solid #bbb",
            background: "#fff",
            color: "#000",
            fontSize: "16px"
          }}
        />
        <button 
          onClick={addTask}
          style={{ padding: "12px 24px", cursor: "pointer", background: "#007bff", color: "#fff", border: "none", borderRadius: "4px", fontSize: "16px", fontWeight: "bold" }}
        >
          Adicionar
        </button>
      </div>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
        <Column title="ENTRADA" status="entrada" />
        <Column title="PLANEJAMENTO" status="planejamento" />
        <Column title="PRONTO PRA OS" status="pronto" />
      </div>
    </div>
  );
}