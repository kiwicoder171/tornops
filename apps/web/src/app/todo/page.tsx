"use client";

import { useState, useEffect } from "react";
import { Kanban, Plus, CheckCircle2, Clock, AlertTriangle, Shield, Check, Trash2 } from "lucide-react";

interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  factionWide: boolean;
  assignedTo?: string;
}

const STORAGE_KEY = "TORN_SUITE_TASKS_DATA";

export default function TodoBoardPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isFactionWide, setIsFactionWide] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted tasks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setTasks(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
    setIsLoaded(true);
  }, []);

  // Save tasks to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks, isLoaded]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: isFactionWide ? "Faction-wide operational priority" : "Personal member objective",
      status: "TODO",
      priority: "MEDIUM",
      factionWide: isFactionWide,
      assignedTo: isFactionWide ? undefined : "You",
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle("");
    setIsFactionWide(false);
  };

  const moveTask = (taskId: string, newStatus: TaskItem["status"]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const columns: Array<{ id: TaskItem["status"]; title: string; color: string }> = [
    { id: "TODO", title: "To Do / Backlog", color: "border-slate-700" },
    { id: "IN_PROGRESS", title: "In Progress", color: "border-blue-500/50" },
    { id: "DONE", title: "Completed", color: "border-emerald-500/50" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Faction & Member Task Board</h1>
        <p className="text-sm text-slate-400 mt-1">
          Coordinate faction-wide war preparations and track personal leveling / training milestones.
        </p>
      </div>

      {/* Task Creation Input */}
      <form onSubmit={handleAddTask} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center gap-3">
        <input
          type="text"
          placeholder="Add a new task (e.g. 'Complete 25 hits', 'Fly for Xanax', 'Train 500 Energy')..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        />
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={isFactionWide}
            onChange={(e) => setIsFactionWide(e.target.checked)}
            className="rounded bg-slate-950 border-slate-700"
          />
          <span>Faction-Wide Goal</span>
        </label>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </form>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col min-h-[350px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <span className="font-semibold text-sm text-white">{col.title}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center p-4 text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                    <span>No tasks in {col.title.toLowerCase()}</span>
                    <span className="text-[11px] text-slate-600 mt-1">Add a task above to begin planning</span>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-all space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-sm text-white leading-snug">{task.title}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {task.factionWide ? (
                            <span className="px-1.5 py-0.5 text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 rounded font-semibold">
                              Faction
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded">
                              Personal
                            </span>
                          )}
                          <button
                            onClick={() => deleteTask(task.id)}
                            title="Delete task"
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-slate-500 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400">{task.description}</p>

                      {/* Quick Move Status Buttons */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                        <span className={`font-mono text-[10px] uppercase font-bold ${
                          task.priority === "URGENT" ? "text-red-400" : task.priority === "HIGH" ? "text-amber-400" : "text-slate-400"
                        }`}>
                          {task.priority}
                        </span>

                        <div className="flex items-center gap-1">
                          {col.id !== "TODO" && (
                            <button
                              onClick={() => moveTask(task.id, "TODO")}
                              className="text-[10px] px-1.5 py-0.5 bg-slate-800 hover:text-white text-slate-400 rounded"
                            >
                              ← Todo
                            </button>
                          )}
                          {col.id !== "IN_PROGRESS" && (
                            <button
                              onClick={() => moveTask(task.id, "IN_PROGRESS")}
                              className="text-[10px] px-1.5 py-0.5 bg-slate-800 hover:text-white text-slate-400 rounded"
                            >
                              Progress
                            </button>
                          )}
                          {col.id !== "DONE" && (
                            <button
                              onClick={() => moveTask(task.id, "DONE")}
                              className="text-[10px] px-1.5 py-0.5 bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 rounded font-medium"
                            >
                              Done ✓
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
