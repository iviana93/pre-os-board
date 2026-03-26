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
// Biblioteca para o arraste com o mouse
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

function TaskCard({ task, index, updateNotes, deleteTask, moveTask, duplicateTask, archiveTask, renameTask }) {
  const [localNotes, setLocalNotes] = useState(task.notes || "");
  const [showNotes, setShowNotes] = useState(false); 

  useEffect(() => {
    setLocalNotes(task.notes || "");
  }, [task.notes]);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            background:
              task.status === "entrada" ? "#e3f2fd" : task.status === "planejamento" ? "#fff3cd" : "#d4edda",
            padding: "8px 10px",
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
                marginTop: "6px", width: "100%", minHeight: "60px", border: "1px solid #999", borderRadius: "4px",
                padding: "6px", fontSize: "12px", boxSizing: "border-box", background: "#fff", color: "#000", resize: "vertical"
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
      )}
    </Draggable>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [title, setTitle] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // Escuta tarefas
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTasks(taskList);
    });
    // Escuta grupos
    const qGroups = query(collection(db, "groups"), orderBy("createdAt", "asc"));
    const unsubGroups = onSnapshot(qGroups, (snapshot) => {
      const groupList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setGroups(groupList);
    });
    return () => { unsub(); unsubGroups(); };
  }, []);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    // Se caiu em uma nova coluna
    if (destination.droppableId !== source.droppableId) {
      // Se caiu dentro de um grupo (o ID do grupo começa com 'group-')
      if (destination.droppableId.startsWith("group-")) {
        const groupId = destination.droppableId.replace("group-", "");
        const group = groups.find(g => g.id === groupId);
        await updateDoc(doc(db, "tasks", draggableId), { 
          groupId: groupId,
          status: group.status 
        });
      } else {
        // Caiu na coluna limpa (fora de grupo)
        await updateDoc(doc(db, "tasks", draggableId), { 
          status: destination.droppableId,
          groupId: null 
        });
      }
    }
  };

  const addTask = async () => {
    if (!title.trim()) return;
    await addDoc(collection(db, "tasks"), { title, notes: "", status: "entrada", createdAt: new Date() });
    setTitle("");
  };

  const addGroup = async () => {
    const name = window.prompt("Nome do novo grupo:");
    if (name) {
      await addDoc(collection(db, "groups"), { name, status: "entrada", createdAt: new Date() });
    }
  };

  const renameTask = async (id, currentTitle) => {
    const newTitle = window.prompt("Editar nome:", currentTitle);
    if (newTitle && newTitle.trim() !== "") await updateDoc(doc(db, "tasks", id), { title: newTitle });
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
    await updateDoc(doc(db, "tasks", id), { status: newStatus, groupId: null });
  };

  const Column = ({ title, status, icon }) => (
    <div style={{ flex: "1 1 250px", maxWidth: "350px", padding: "10px", background: "#f5f5f5", borderRadius: "8px", minHeight: "60vh", border: "1px solid #ccc" }}>
      <h2 style={{ fontSize: "0.85rem", textAlign: "center", color: "#333", textTransform: "uppercase", marginBottom: "12px", fontWeight: "bold" }}>
        {icon} {title} ({tasks.filter(t => t.status === status).length})
      </h2>
      
      <Droppable droppableId={status}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: "100px" }}>
            
            {/* RENDERIZA GRUPOS DENTRO DA COLUNA */}
            {groups.filter(g => g.status === status).map(group => (
              <Droppable key={group.id} droppableId={`group-${group.id}`}>
                {(gpProvided, gpSnapshot) => (
                  <div 
                    ref={gpProvided.innerRef} 
                    {...gpProvided.droppableProps}
                    style={{ 
                      background: gpSnapshot.isDraggingOver ? "#ddd" : "#fff", 
                      border: "2px dashed #bbb", borderRadius: "8px", padding: "8px", marginBottom: "15px" 
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "bold", color: "#666" }}>📦 {group.name}</span>
                      <button onClick={() => deleteDoc(doc(db, "groups", group.id))} style={{ fontSize: "10px", border: "none", background: "none", color: "red", cursor: "pointer" }}>remover grupo</button>
                    </div>
                    {tasks.filter(t => t.groupId === group.id).map((task, index) => (
                      <TaskCard key={task.id} index={index} task={task} archiveTask={archiveTask} moveTask={moveTask} renameTask={renameTask} duplicateTask={duplicateTask} deleteTask={(id) => window.confirm("Excluir?") && deleteDoc(doc(db, "tasks", id))} updateNotes={(id, n) => updateDoc(doc(db, "tasks", id), {notes: n})} />
                    ))}
                    {gpProvided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}

            {/* RENDERIZA TAREFAS FORA DE GRUPOS */}
            {tasks.filter((t) => t.status === status && !t.groupId).map((task, index) => (
              <TaskCard key={task.id} index={index} task={task} archiveTask={archiveTask} moveTask={moveTask} renameTask={renameTask} duplicateTask={duplicateTask} deleteTask={(id) => window.confirm("Excluir?") && deleteDoc(doc(db, "tasks", id))} updateNotes={(id, n) => updateDoc(doc(db, "tasks", id), {notes: n})} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ padding: "15px", fontFamily: "sans-serif", backgroundColor: "#ffffff", minHeight: "100vh", color: "#000000" }}>
        <h1 style={{ textAlign: "center", fontSize: "1.4rem", marginBottom: "20px", color: "#000", fontWeight: "bold" }}>GERENCIADOR DE OS</h1>

        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center", gap: "8px" }}>
          <input placeholder="Nova OS..." value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} style={{ padding: "8px 12px", width: "200px", borderRadius: "4px", border: "1px solid #000", fontSize: "14px" }} />
          <button onClick={addTask} style={{ padding: "8px 16px", background: "#000", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>+</button>
          <button onClick={addGroup} style={{ padding: "8px 12px", background: "#666", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Novo Grupo</button>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <Column title="Entrada" status="entrada" icon="📥" />
          <Column title="Planejamento" status="planejamento" icon="⚙️" />
          <Column title="Pronto" status="pronto" icon="📄" />
        </div>

        {/* HISTÓRICO MANTIDO IGUAL */}
        <div style={{ marginTop: "40px", borderTop: "2px solid #ddd", paddingTop: "20px" }}>
          <button onClick={() => setShowHistory(!showHistory)} style={{ display: "block", margin: "0 auto", padding: "8px 20px", background: "#444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
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
                      <td style={{ padding: "10px", color: "#666" }}>{task.finishedAt?.toDate().toLocaleDateString("pt-BR")}</td>
                      <td style={{ padding: "10px" }}>
                        <button onClick={() => updateDoc(doc(db, "tasks", task.id), {status: "pronto", groupId: null})} style={{ marginRight: "5px", cursor: "pointer", background: "#fff", border: "1px solid #ccc", padding: "2px 5px", fontSize: "11px" }}>Restaurar</button>
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
    </DragDropContext>
  );
}