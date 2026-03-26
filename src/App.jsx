import React, { useState, useEffect } from "react";
// Importamos a conexão do banco de dados e as funções do Firebase
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
function TaskCard({ task, updateNotes, deleteTask, moveTask }) {
  const [localNotes, setLocalNotes] = useState(task.notes || "");

  // Atualiza o estado local se a nota mudar no banco de dados (por outro dispositivo)
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
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>{task.title}</strong>
        <button 
          onClick={() => deleteTask(task.id)} 
          style={{ cursor: "pointer", border: "none", background: "none" }}
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
          border: "1px solid #ddd",
          borderRadius: 4,
          padding: 5,
          fontSize: 14,
          boxSizing: "border-box"
        }}
      />

      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between" }}>
        <button onClick={() => moveTask(task.id, "left")}>◀</button>
        <button onClick={() => moveTask(task.id, "right")}>▶</button>
      </div>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");

  // 1. BUSCAR TAREFAS EM TEMPO REAL
  useEffect(() => {
    // Ordenamos por data de criação para as novas aparecerem no fim ou início
    const q = query(collection(db, "tasks"), orderBy("createdAt", "asc"));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(taskList);
    });

    return () => unsub(); // Fecha a conexão quando o componente desmonta
  }, []);

  // 2. ADICIONAR NOVA TAREFA
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
      console.error("Erro ao salvar no Firebase:", error);
    }
  };

  // 3. ATUALIZAR AS NOTAS (Quando sai do campo de texto)
  const updateNotes = async (id, value) => {
    try {
      const taskRef = doc(db, "tasks", id);
      await updateDoc(taskRef, { notes: value });
    } catch (error) {
      console.error("Erro ao atualizar notas:", error);
    }
  };

  // 4. DELETAR TAREFA
  const deleteTask = async (id) => {
    try {
      await deleteDoc(doc(db, "tasks", id));
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  // 5. MOVER TAREFA ENTRE COLUNAS
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

    try {
      const taskRef = doc(db, "tasks", id);
      await updateDoc(taskRef, { status: newStatus });
    } catch (error) {
      console.error("Erro ao mover tarefa:", error);
    }
  };

  // Sub-componente de Coluna para organizar o layout
  const Column = ({ title, status }) => (
    <div style={{ flex: 1, padding: 10, background: "#f8f9fa", borderRadius: 8 }}>
      <h2 style={{ fontSize: "1.2rem", textAlign: "center" }}>{title}</h2>
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
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Pre-OS Board (Firebase)</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Título da tarefa"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          style={{ padding: "8px", marginRight: 10, width: "250px" }}
        />
        <button 
          onClick={addTask}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          Adicionar
        </button>
      </div>

      <div style={{ display: "flex", gap: 20 }}>
        <Column title="ENTRADA" status="entrada" />
        <Column title="PLANEJAMENTO" status="planejamento" />
        <Column title="PRONTO PRA OS" status="pronto" />
      </div>
    </div>
  );
}