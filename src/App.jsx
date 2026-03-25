import React, { useState, useEffect } from "react";

function TaskCard({ task, updateNotes, deleteTask, moveTask }) {
  const [localNotes, setLocalNotes] = useState(task.notes || "");

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
        <button onClick={() => deleteTask(task.id)}>🗑</button>
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

  useEffect(() => {
    const saved = localStorage.getItem("tasks");
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!title.trim()) return;

    const newTask = {
      id: Date.now(),
      title,
      notes: "",
      status: "entrada",
    };

    setTasks([...tasks, newTask]);
    setTitle("");
  };

  const updateNotes = (id, value) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, notes: value } : t))
    );
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const moveTask = (id, direction) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;

        if (direction === "right") {
          if (task.status === "entrada") return { ...task, status: "planejamento" };
          if (task.status === "planejamento") return { ...task, status: "pronto" };
        }

        if (direction === "left") {
          if (task.status === "planejamento") return { ...task, status: "entrada" };
          if (task.status === "pronto") return { ...task, status: "planejamento" };
        }

        return task;
      })
    );
  };

  const Column = ({ title, status }) => (
    <div style={{ flex: 1, padding: 10 }}>
      <h2>{title}</h2>

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
    <div style={{ padding: 20 }}>
      <h1>Pre-OS Board</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Título da tarefa"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ marginRight: 10 }}
        />

        <button onClick={addTask}>Adicionar</button>
      </div>

      <div style={{ display: "flex", gap: 20 }}>
        <Column title="ENTRADA" status="entrada" />
        <Column title="PLANEJAMENTO" status="planejamento" />
        <Column title="PRONTO PRA OS" status="pronto" />
      </div>
    </div>
  );
}
