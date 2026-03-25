import React, { useState, useEffect } from "react";

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

  const getCardColor = (status) => {
    if (status === "entrada") return "#e3f2fd"; // azul claro
    if (status === "planejamento") return "#fff3cd"; // amarelo claro
    if (status === "pronto") return "#d4edda"; // verde claro
    return "white";
  };

  const Column = ({ title, status }) => (
    <div style={{ flex: 1, padding: 10 }}>
      <h2>{title}</h2>

      {tasks
        .filter((t) => t.status === status)
        .map((task) => (
          <div
            key={task.id}
            style={{
              background: getCardColor(task.status),
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
              value={task.notes}
              onChange={(e) => updateNotes(task.id, e.target.value)}
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
