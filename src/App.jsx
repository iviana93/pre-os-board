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

function TaskCard({ task, updateNotes, deleteTask, moveTask }) {
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
        color: "#333", // Garante texto escuro
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ color: "#000" }}>{task.title}</strong>
        <button 
          onClick={() => deleteTask(task.id)} 
          style={{ cursor: "pointer", border: "none", background: "none", fontSize: "16px" }}
        >
          🗑
        </button>
      </div>

      <textarea
        placeholder="Clique aqui e escreva..."
        value={localNotes}
        onChange={(e) => setLocalNotes(e.target.value)}
        onBlur={() => updateNotes(task.id, localNotes)}
        style={{
          marginTop: 8,
          width: "100%",
          minHeight: 60,
          border: "1px solid #bbb",
          borderRadius: 4,
          padding: 5,
          fontSize: 14,
          boxSizing: "border-box",
          background: "#fff",
          color: "#333" // Texto da nota sempre escuro
        }}
      />

      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between" }}>
        <button onClick={() => moveTask(task.id, "left")} style={{ padding: "2px 8px" }}>◀</button>
        <button onClick={() => moveTask(task.id, "right")} style={{ padding: "2px 8px" }}>▶</button>
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

  const updateNotes = async (id, value) => {
    try {
      await updateDoc(doc(db, "tasks", id), { notes: value });
    } catch (error) {
      console.error(error);
    }
  };

  const deleteTask = async (id) => {
    if(window.confirm("Excluir esta tarefa?")) {
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
    <div style={{ flex: 1, padding: 10, background: "#f0f0f0", borderRadius: 8, minHeight: "70vh" }}>
      <h2 style={{ fontSize: "1.1rem", textAlign: "center", color: "#333", marginBottom: 15 }}>{title}</h2>
      {tasks
        .filter((t) => t.status === status)
        .map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            updateNotes={updateNotes}
            deleteTask={deleteTask}
            moveTask={moveTask}
          />
        ))}
    </div>
  );

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", backgroundColor: "#fff", minHeight: "100vh" }}>
      <h1 style={{ color: "#222", textAlign: "center" }}>Pre-OS Board (Firebase)</h1>

      <div style={{ marginBottom: 20, textAlign: "center" }}>
        <input
          placeholder="Título da tarefa"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          style={{ 
            padding: "10px", 
            marginRight: 10, 
            width: "250px", 
            borderRadius: "4px", 
            border: "1px solid #ccc",
            background: "#fff",
            color: "#000" 
          }}
        />
        <button 
          onClick={addTask}
          style={{ padding: "10px 20px", cursor: "pointer", background: "#007bff", color: "#fff", border: "none", borderRadius: "4px" }}
        >
          Adicionar
        </button>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <Column title="ENTRADA" status="entrada" />
        <Column title="PLANEJAMENTO" status="planejamento" />
        <Column title="PRONTO PRA OS" status="pronto" />
      </div>
    </div>
  );
}