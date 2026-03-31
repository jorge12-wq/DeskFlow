import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Save, Play, FileText, UserCheck, CheckSquare,
  GitBranch, Mail, CheckCircle, XCircle, Trash2, Link2, X,
  ZoomIn, ZoomOut, Maximize2, Plus, Settings,
  Database, Globe, Zap, Package, Users, Table2, MessageSquare, Hash
} from 'lucide-react';
import { workflowsApi } from '../api/workflows';
import type { WorkflowNodoDto, WorkflowConexionDto } from '../api/workflows';
import { toast } from 'sonner';

// ─── Node types ───────────────────────────────────────────────────────────────
interface NodeType {
  tipo: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  borderColor: string;
  group: 'flujo' | 'integracion';
}

const NODE_TYPES: NodeType[] = [
  // ── Flujo ──
  { tipo: 'inicio',      label: 'Inicio',         icon: Play,         color: 'bg-green-500',   borderColor: 'border-green-600',   group: 'flujo' },
  { tipo: 'formulario',  label: 'Formulario',     icon: FileText,     color: 'bg-blue-500',    borderColor: 'border-blue-600',    group: 'flujo' },
  { tipo: 'aprobacion',  label: 'Aprobación',     icon: UserCheck,    color: 'bg-amber-500',   borderColor: 'border-amber-600',   group: 'flujo' },
  { tipo: 'tareas',      label: 'Tareas',         icon: CheckSquare,  color: 'bg-violet-500',  borderColor: 'border-violet-600',  group: 'flujo' },
  { tipo: 'condicional', label: 'Condicional',    icon: GitBranch,    color: 'bg-orange-500',  borderColor: 'border-orange-600',  group: 'flujo' },
  { tipo: 'email',       label: 'Email',          icon: Mail,         color: 'bg-cyan-500',    borderColor: 'border-cyan-600',    group: 'flujo' },
  { tipo: 'fin',         label: 'Fin',            icon: CheckCircle,  color: 'bg-emerald-500', borderColor: 'border-emerald-600', group: 'flujo' },
  { tipo: 'cancelar',    label: 'Cancelar',       icon: XCircle,      color: 'bg-red-500',     borderColor: 'border-red-600',     group: 'flujo' },
  // ── Integraciones ──
  { tipo: 'int-sap',     label: 'SAP',            icon: Database,     color: 'bg-[#0070f3]',   borderColor: 'border-blue-700',    group: 'integracion' },
  { tipo: 'int-wms',     label: 'WMS',            icon: Package,      color: 'bg-[#d97706]',   borderColor: 'border-amber-700',   group: 'integracion' },
  { tipo: 'int-rest',    label: 'REST API',       icon: Globe,        color: 'bg-teal-600',    borderColor: 'border-teal-700',    group: 'integracion' },
  { tipo: 'int-bd',      label: 'Base de Datos',  icon: Database,     color: 'bg-purple-600',  borderColor: 'border-purple-700',  group: 'integracion' },
  { tipo: 'int-webhook', label: 'Webhook',        icon: Zap,          color: 'bg-yellow-500',  borderColor: 'border-yellow-600',  group: 'integracion' },
  { tipo: 'int-teams',   label: 'Teams',          icon: MessageSquare,color: 'bg-[#6264a7]',   borderColor: 'border-indigo-700',  group: 'integracion' },
  { tipo: 'int-slack',   label: 'Slack',          icon: Hash,         color: 'bg-[#4a154b]',   borderColor: 'border-purple-900',  group: 'integracion' },
  { tipo: 'int-ad',      label: 'Active Directory',icon: Users,       color: 'bg-slate-600',   borderColor: 'border-slate-700',   group: 'integracion' },
  { tipo: 'int-excel',   label: 'Excel / CSV',    icon: Table2,       color: 'bg-green-700',   borderColor: 'border-green-800',   group: 'integracion' },
];

const getNodeType = (tipo: string) =>
  NODE_TYPES.find(t => t.tipo === tipo) ?? NODE_TYPES[0];

// ─── Canvas constants ──────────────────────────────────────────────────────────
const NODE_W   = 200;
const NODE_H   = 64;   // min height; used for edge midpoints
const CANVAS_W = 2400;
const CANVAS_H = 1600;

// ─── Types ────────────────────────────────────────────────────────────────────
interface FlowNode extends WorkflowNodoDto {
  posicionX: number;
  posicionY: number;
}
interface FlowEdge extends WorkflowConexionDto {}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WorkflowBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: wf, isLoading } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => workflowsApi.getById(id!),
    enabled: !!id,
  });

  const [nodes, setNodes]               = useState<FlowNode[]>([]);
  const [edges, setEdges]               = useState<FlowEdge[]>([]);
  const [workflowName, setWorkflowName] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  // pendingEdge: conexión en curso (drag desde un puerto)
  const [pendingEdge, setPendingEdge] = useState<{ nodeId: string; lado: 'right'|'left'|'top'|'bottom'; x: number; y: number } | null>(null);
  // draggingCP: arrastre del punto de control de curva de un edge
  const [draggingCP, setDraggingCP] = useState<{ edgeId: string } | null>(null);
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  // pendingDrag: click presionado pero aún sin mover — no inicia arrastre hasta superar el umbral
  const [pendingDrag, setPendingDrag] = useState<{ id: string; ox: number; oy: number; startX: number; startY: number } | null>(null);
  const DRAG_THRESHOLD = 5; // píxeles
  const [zoom, setZoom]         = useState(1);
  const [pan, setPan]           = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning]   = useState(false);
  const [panStart, setPanStart]     = useState({ x: 0, y: 0, px: 0, py: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wf) {
      setWorkflowName(wf.nombre);
      setNodes(wf.nodos as FlowNode[]);
      setEdges(wf.conexiones);
    }
  }, [wf]);

  // ESC cancela drag de conexión o selección de edge
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setPendingEdge(null); setSelectedEdgeId(null); setDraggingCP(null); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdgeId) {
        deleteEdge(selectedEdgeId); setSelectedEdgeId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedEdgeId]);

  const saveMutation = useMutation({
    mutationFn: () => workflowsApi.save(id!, {
      nombre:      workflowName,
      descripcion: wf?.descripcion,
      tipo:        wf?.tipo ?? 'General',
      servicioId:  wf?.servicioId,
      activo:      wf?.activo ?? true,
      nodos:       nodes,
      conexiones:  edges,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); toast.success('Workflow guardado'); },
    onError: () => toast.error('Error al guardar'),
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const canvasPoint = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: (clientX - rect.left - pan.x) / zoom, y: (clientY - rect.top - pan.y) / zoom };
  }, [pan, zoom]);

  const getConfig = (node: FlowNode | undefined, key: string) => {
    if (!node?.configJson) return '';
    try { return JSON.parse(node.configJson)[key] ?? ''; } catch { return ''; }
  };
  const updateNodeName   = (name: string) =>
    setNodes(ns => ns.map(n => n.id === selectedNodeId ? { ...n, nombre: name } : n));
  const updateNodeConfig = (key: string, value: string) =>
    setNodes(ns => ns.map(n => {
      if (n.id !== selectedNodeId) return n;
      const cfg = n.configJson ? JSON.parse(n.configJson) : {};
      cfg[key] = value;
      return { ...n, configJson: JSON.stringify(cfg) };
    }));

  // ── Palette drag-drop ─────────────────────────────────────────────────────
  const handlePaletteDragStart = (e: React.DragEvent, tipo: string) =>
    e.dataTransfer.setData('nodeType', tipo);

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const tipo = e.dataTransfer.getData('nodeType');
    if (!tipo) return;
    const { x, y } = canvasPoint(e.clientX, e.clientY);
    addNode(tipo, x - NODE_W / 2, y - NODE_H / 2);
  };

  const addNode = (tipo: string, x: number, y: number) => {
    const nt = getNodeType(tipo);
    const newNode: FlowNode = {
      id:        crypto.randomUUID(),
      tipoNodo:  tipo,
      nombre:    nt.label,
      posicionX: Math.max(0, x),
      posicionY: Math.max(0, y),
    };
    setNodes(ns => [...ns, newNode]);
    setSelectedNodeId(newNode.id);
  };

  // ── Helpers para crear conexión ───────────────────────────────────────────
  const crearConexion = (origenId: string, destinoId: string, origenLado?: 'right'|'left'|'top'|'bottom', destinoLado?: 'right'|'left'|'top'|'bottom') => {
    if (edges.find(ed => ed.nodoOrigenId === origenId && ed.nodoDestinoId === destinoId)) return;
    const srcNode = nodes.find(n => n.id === origenId);
    const isConditional = srcNode?.tipoNodo === 'condicional';
    const existingFromSrc = edges.filter(ed => ed.nodoOrigenId === origenId).length;
    const etiqueta = isConditional ? (existingFromSrc === 0 ? 'Sí' : 'No') : undefined;
    setEdges(es => [...es, { id: crypto.randomUUID(), nodoOrigenId: origenId, nodoDestinoId: destinoId, etiqueta, orden: existingFromSrc, origenLado, destinoLado }]);
  };

  // Puerto más cercano al punto dado dentro de un nodo
  const closestPort = (node: FlowNode, mx: number, my: number): Lado => {
    const candidates: Lado[] = ['right', 'left', 'bottom', 'top'];
    let best: Lado = 'left';
    let bestDist = Infinity;
    for (const lado of candidates) {
      const pt = getPortPoint(node, lado);
      const d = Math.hypot(pt.x - mx, pt.y - my);
      if (d < bestDist) { bestDist = d; best = lado; }
    }
    return best;
  };

  // ── Node interactions ─────────────────────────────────────────────────────
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (pendingEdge) return; // mouseUp en nodo lo maneja handleNodeMouseUp
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    const node = nodes.find(n => n.id === nodeId)!;
    const cp = canvasPoint(e.clientX, e.clientY);
    // Guarda el intento de drag pero NO activa dragging todavía
    setPendingDrag({ id: nodeId, ox: cp.x - node.posicionX, oy: cp.y - node.posicionY, startX: e.clientX, startY: e.clientY });
  };

  const handleNodeMouseUp = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    // Siempre limpiar estado de arrastre (stopPropagation impide que llegue al canvas)
    setDragging(null);
    setPendingDrag(null);
    setDraggingCP(null);
    // Si había una conexión en curso, completarla
    if (pendingEdge && pendingEdge.nodeId !== nodeId) {
      const { x, y } = canvasPoint(e.clientX, e.clientY);
      const tgtNode = nodes.find(n => n.id === nodeId)!;
      const destLado = closestPort(tgtNode, x, y);
      crearConexion(pendingEdge.nodeId, nodeId, pendingEdge.lado, destLado);
      setPendingEdge(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    // Promover pendingDrag a dragging real si superó el umbral de movimiento
    if (pendingDrag && !dragging) {
      const dist = Math.hypot(e.clientX - pendingDrag.startX, e.clientY - pendingDrag.startY);
      if (dist > DRAG_THRESHOLD) {
        setDragging({ id: pendingDrag.id, ox: pendingDrag.ox, oy: pendingDrag.oy });
        setPendingDrag(null);
      }
      return;
    }
    if (dragging) {
      const { x, y } = canvasPoint(e.clientX, e.clientY);
      setNodes(ns => ns.map(n => n.id === dragging.id
        ? { ...n, posicionX: Math.max(0, x - dragging.ox), posicionY: Math.max(0, y - dragging.oy) }
        : n));
    } else if (draggingCP) {
      const { x, y } = canvasPoint(e.clientX, e.clientY);
      setEdges(es => es.map(ed => {
        if (ed.id !== draggingCP.edgeId) return ed;
        const src = nodes.find(n => n.id === ed.nodoOrigenId);
        const tgt = nodes.find(n => n.id === ed.nodoDestinoId);
        if (!src || !tgt) return ed;
        // midpoint auto calculado
        const { srcLado, tgtLado } = (ed.origenLado && ed.destinoLado)
          ? { srcLado: ed.origenLado as Lado, tgtLado: ed.destinoLado as Lado }
          : autoLados(src, tgt);
        const { x: sx, y: sy } = getPortPoint(src, srcLado);
        const { x: tx, y: ty } = getPortPoint(tgt, tgtLado);
        const autoMidX = (sx + tx) / 2;
        const autoMidY = (sy + ty) / 2;
        return { ...ed, midOffsetX: x - autoMidX, midOffsetY: y - autoMidY };
      }));
    } else if (pendingEdge) {
      const { x, y } = canvasPoint(e.clientX, e.clientY);
      setPendingEdge(p => p ? { ...p, x, y } : null);
    } else if (isPanning) {
      setPan({ x: panStart.px + (e.clientX - panStart.x), y: panStart.py + (e.clientY - panStart.y) });
    }
  };

  const handleCanvasMouseUp = () => {
    setDragging(null);
    setPendingDrag(null);
    setDraggingCP(null);
    setIsPanning(false);
    if (pendingEdge) setPendingEdge(null); // soltar en canvas cancela la conexión
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      if (pendingEdge) { setPendingEdge(null); return; }
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY, px: pan.x, py: pan.y });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(2, Math.max(0.3, z - e.deltaY * 0.001)));
  };

  const deleteSelected = () => {
    if (!selectedNodeId) return;
    setNodes(ns => ns.filter(n => n.id !== selectedNodeId));
    setEdges(es => es.filter(e => e.nodoOrigenId !== selectedNodeId && e.nodoDestinoId !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const deleteEdge = (edgeId: string) => setEdges(es => es.filter(e => e.id !== edgeId));

  // ── Paths ─────────────────────────────────────────────────────────────────
  type Lado = 'right' | 'left' | 'top' | 'bottom';

  // Obtiene el punto exacto de un puerto en el borde del nodo
  const getPortPoint = (node: FlowNode, lado: Lado) => {
    const cx = node.posicionX + NODE_W / 2;
    const cy = node.posicionY + NODE_H / 2;
    switch (lado) {
      case 'right':  return { x: node.posicionX + NODE_W, y: cy };
      case 'left':   return { x: node.posicionX,          y: cy };
      case 'bottom': return { x: cx, y: node.posicionY + NODE_H };
      case 'top':    return { x: cx, y: node.posicionY };
    }
  };

  // Auto-calcula el par de puertos óptimo basado en posición relativa
  const autoLados = (src: FlowNode, tgt: FlowNode): { srcLado: Lado; tgtLado: Lado } => {
    const dx = (tgt.posicionX + NODE_W / 2) - (src.posicionX + NODE_W / 2);
    const dy = (tgt.posicionY + NODE_H / 2) - (src.posicionY + NODE_H / 2);
    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx >= 0 ? { srcLado: 'right', tgtLado: 'left' } : { srcLado: 'left', tgtLado: 'right' };
    } else {
      return dy >= 0 ? { srcLado: 'bottom', tgtLado: 'top' } : { srcLado: 'top', tgtLado: 'bottom' };
    }
  };

  const buildPath = (src: FlowNode, tgt: FlowNode, edge?: FlowEdge) => {
    const { srcLado, tgtLado } = (edge?.origenLado && edge?.destinoLado)
      ? { srcLado: edge.origenLado as Lado, tgtLado: edge.destinoLado as Lado }
      : autoLados(src, tgt);

    const { x: sx, y: sy } = getPortPoint(src, srcLado);
    const { x: tx, y: ty } = getPortPoint(tgt, tgtLado);

    const isH = srcLado === 'right' || srcLado === 'left';
    const offset = Math.max(50, isH ? Math.abs(tx - sx) / 2 : Math.abs(ty - sy) / 2);

    let c1x: number, c1y: number, c2x: number, c2y: number;
    if (isH) {
      const dir = srcLado === 'right' ? 1 : -1;
      c1x = sx + dir * offset; c1y = sy;
      c2x = tx - dir * offset; c2y = ty;
    } else {
      const dir = srcLado === 'bottom' ? 1 : -1;
      c1x = sx; c1y = sy + dir * offset;
      c2x = tx; c2y = ty - dir * offset;
    }

    // Aplicar offset de curva manual si existe
    const mox = edge?.midOffsetX ?? 0;
    const moy = edge?.midOffsetY ?? 0;
    c1x += mox; c1y += moy;
    c2x += mox; c2y += moy;

    return `M ${sx} ${sy} C ${c1x} ${c1y} ${c2x} ${c2y} ${tx} ${ty}`;
  };

  // Midpoint del edge (para label y handle de curva)
  const edgeMidpoint = (src: FlowNode, tgt: FlowNode, edge?: FlowEdge) => {
    const { srcLado, tgtLado } = (edge?.origenLado && edge?.destinoLado)
      ? { srcLado: edge.origenLado as Lado, tgtLado: edge.destinoLado as Lado }
      : autoLados(src, tgt);
    const { x: sx, y: sy } = getPortPoint(src, srcLado);
    const { x: tx, y: ty } = getPortPoint(tgt, tgtLado);
    return {
      x: (sx + tx) / 2 + (edge?.midOffsetX ?? 0),
      y: (sy + ty) / 2 + (edge?.midOffsetY ?? 0),
    };
  };

  const fitScreen = () => {
    if (nodes.length === 0) return;
    const xs = nodes.map(n => n.posicionX);
    const ys = nodes.map(n => n.posicionY);
    const minX = Math.min(...xs) - 60;
    const minY = Math.min(...ys) - 60;
    const maxX = Math.max(...xs) + NODE_W + 60;
    const maxY = Math.max(...ys) + NODE_H + 60;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const z = Math.min(rect.width / (maxX - minX), rect.height / (maxY - minY), 1.5);
    setZoom(z);
    setPan({ x: -minX * z + (rect.width - (maxX - minX) * z) / 2, y: -minY * z + (rect.height - (maxY - minY) * z) / 2 });
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const flujoPalette     = NODE_TYPES.filter(t => t.group === 'flujo');
  const integracionPalette = NODE_TYPES.filter(t => t.group === 'integracion');

  if (isLoading) return <div className="p-6 text-gray-400">Cargando...</div>;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 57px)' }}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0">
        <button onClick={() => navigate('/workflows')} className="p-1.5 text-gray-400 hover:text-gray-700 rounded">
          <ArrowLeft size={16} />
        </button>
        <div className="w-px h-5 bg-gray-200" />
        <input
          value={workflowName}
          onChange={e => setWorkflowName(e.target.value)}
          className="text-sm font-semibold text-gray-900 border-0 outline-none bg-transparent focus:bg-gray-50 px-2 py-1 rounded"
        />
        <div className="flex-1" />
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="p-0.5 hover:text-gray-900 text-gray-500"><ZoomOut size={14} /></button>
          <span className="text-xs text-gray-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-0.5 hover:text-gray-900 text-gray-500"><ZoomIn size={14} /></button>
        </div>
        <button onClick={fitScreen} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded" title="Ajustar pantalla">
          <Maximize2 size={14} />
        </button>
        <div className="w-px h-5 bg-gray-200" />
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Save size={14} /> {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left palette ── */}
        <div className="w-52 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
          <div className="p-3 space-y-4">

            {/* Flujo */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Flujo</p>
              <div className="space-y-1">
                {flujoPalette.map(nt => (
                  <div
                    key={nt.tipo}
                    draggable
                    onDragStart={e => handlePaletteDragStart(e, nt.tipo)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 cursor-grab hover:border-indigo-300 hover:bg-indigo-50 transition-colors select-none"
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${nt.color} flex-shrink-0`}>
                      <nt.icon size={13} className="text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{nt.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Integraciones */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Integraciones</p>
              <div className="space-y-1">
                {integracionPalette.map(nt => (
                  <div
                    key={nt.tipo}
                    draggable
                    onDragStart={e => handlePaletteDragStart(e, nt.tipo)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 cursor-grab hover:border-indigo-300 hover:bg-indigo-50 transition-colors select-none"
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${nt.color} flex-shrink-0`}>
                      <nt.icon size={13} className="text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{nt.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 leading-relaxed">
                Arrastrá nodos al canvas. Usá el botón <Link2 size={10} className="inline" /> para conectarlos.
              </p>
            </div>
          </div>
        </div>

        {/* ── Canvas ── */}
        <div
          ref={canvasRef}
          className={`flex-1 overflow-hidden relative bg-gray-50 ${pendingEdge ? 'cursor-crosshair' : draggingCP ? 'cursor-move' : isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onMouseDown={handleCanvasMouseDown}
          onDrop={handleCanvasDrop}
          onDragOver={e => e.preventDefault()}
          onWheel={handleWheel}
        >
          {/* Dot grid */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none canvas-bg" style={{ zIndex: 0 }}>
            <defs>
              <pattern id="dots" x={pan.x % (20 * zoom)} y={pan.y % (20 * zoom)} width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse">
                <circle cx={1} cy={1} r={0.8} fill="#d1d5db" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" className="canvas-bg" />
          </svg>

          {/* Transformed group */}
          <div
            className="absolute top-0 left-0"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', width: CANVAS_W, height: CANVAS_H }}
          >
            {/* SVG edges */}
            <svg className="absolute inset-0 pointer-events-none" width={CANVAS_W} height={CANVAS_H} style={{ overflow: 'visible' }}>
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#6366f1" />
                </marker>
                <marker id="arrow-pending" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#a5b4fc" />
                </marker>
              </defs>

              {/* Edges guardados */}
              {edges.map(edge => {
                const src = nodes.find(n => n.id === edge.nodoOrigenId);
                const tgt = nodes.find(n => n.id === edge.nodoDestinoId);
                if (!src || !tgt) return null;
                const d = buildPath(src, tgt, edge);
                const mid = edgeMidpoint(src, tgt, edge);
                const isEdgeSel = edge.id === selectedEdgeId;
                return (
                  <g key={edge.id} style={{ pointerEvents: 'all' }}>
                    {/* Hit area invisible */}
                    <path d={d} stroke="transparent" strokeWidth={14} fill="none" style={{ cursor: 'pointer' }}
                      onClick={e => { e.stopPropagation(); setSelectedEdgeId(isEdgeSel ? null : edge.id); setSelectedNodeId(null); }}
                    />
                    {/* Trazo visible */}
                    <path d={d}
                      stroke={isEdgeSel ? '#4f46e5' : '#6366f1'}
                      strokeWidth={isEdgeSel ? 2.5 : 2}
                      fill="none"
                      markerEnd="url(#arrow)"
                      strokeDasharray={edge.etiqueta === 'No' ? '6 3' : undefined}
                    />
                    {/* Label condicional */}
                    {edge.etiqueta && (
                      <g>
                        <rect x={mid.x - 16} y={mid.y - 10} width={32} height={20} rx={5} fill="white" stroke="#6366f1" strokeWidth={1} />
                        <text x={mid.x} y={mid.y + 5} textAnchor="middle" fontSize={11} fill="#4f46e5" fontWeight="600">{edge.etiqueta}</text>
                      </g>
                    )}
                    {/* Handle de curva (solo edge seleccionado) */}
                    {isEdgeSel && (
                      <g style={{ cursor: 'move', pointerEvents: 'all' }}
                        onMouseDown={e => { e.stopPropagation(); setDraggingCP({ edgeId: edge.id }); }}
                      >
                        {/* Líneas guía hacia puertos */}
                        <line
                          x1={mid.x} y1={mid.y}
                          x2={getPortPoint(src, (edge.origenLado as Lado) ?? autoLados(src, tgt).srcLado).x}
                          y2={getPortPoint(src, (edge.origenLado as Lado) ?? autoLados(src, tgt).srcLado).y}
                          stroke="#a5b4fc" strokeWidth={1} strokeDasharray="3 2"
                        />
                        <line
                          x1={mid.x} y1={mid.y}
                          x2={getPortPoint(tgt, (edge.destinoLado as Lado) ?? autoLados(src, tgt).tgtLado).x}
                          y2={getPortPoint(tgt, (edge.destinoLado as Lado) ?? autoLados(src, tgt).tgtLado).y}
                          stroke="#a5b4fc" strokeWidth={1} strokeDasharray="3 2"
                        />
                        {/* Rombo draggable */}
                        <rect
                          x={mid.x - 7} y={mid.y - 7}
                          width={14} height={14}
                          transform={`rotate(45 ${mid.x} ${mid.y})`}
                          fill="white" stroke="#4f46e5" strokeWidth={2} rx={1}
                        />
                        {/* Botón eliminar en el handle */}
                        <g onClick={e => { e.stopPropagation(); if (confirm('¿Eliminar esta conexión?')) { deleteEdge(edge.id); setSelectedEdgeId(null); } }}
                          style={{ cursor: 'pointer' }}>
                          <circle cx={mid.x + 14} cy={mid.y - 14} r={8} fill="#ef4444" />
                          <text x={mid.x + 14} y={mid.y - 10} textAnchor="middle" fontSize={11} fill="white" fontWeight="bold">×</text>
                        </g>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Preview de conexión en curso (drag) */}
              {pendingEdge && (() => {
                const srcNode = nodes.find(n => n.id === pendingEdge.nodeId);
                if (!srcNode) return null;
                const { x: sx, y: sy } = getPortPoint(srcNode, pendingEdge.lado);
                const dx = pendingEdge.x - sx;
                const dy = pendingEdge.y - sy;
                const offset = Math.max(40, Math.max(Math.abs(dx), Math.abs(dy)) / 2);
                const isH = Math.abs(dx) >= Math.abs(dy);
                let c1x: number, c1y: number;
                if (isH) { c1x = sx + (dx > 0 ? offset : -offset); c1y = sy; }
                else      { c1x = sx; c1y = sy + (dy > 0 ? offset : -offset); }
                return (
                  <path
                    d={`M ${sx} ${sy} Q ${c1x} ${c1y} ${pendingEdge.x} ${pendingEdge.y}`}
                    stroke="#a5b4fc" strokeWidth={2} fill="none"
                    strokeDasharray="6 3" markerEnd="url(#arrow-pending)"
                  />
                );
              })()}
            </svg>

            {/* Nodes */}
            {nodes.map(node => {
              const nt = getNodeType(node.tipoNodo);
              const isSelected     = node.id === selectedNodeId;
              const isConnectSrc  = node.id === pendingEdge?.nodeId;
              const isDropTarget  = pendingEdge && pendingEdge.nodeId !== node.id;
              const isIntegration = nt.group === 'integracion';
              return (
                <div
                  key={node.id}
                  style={{ position: 'absolute', left: node.posicionX, top: node.posicionY, width: NODE_W, minHeight: NODE_H, zIndex: isSelected ? 10 : 1, userSelect: 'none' }}
                  className={`rounded-xl border-2 shadow-sm bg-white cursor-pointer transition-shadow
                    ${isSelected ? `${nt.borderColor} shadow-lg ring-2 ring-indigo-300` : 'border-white hover:shadow-md border-gray-200'}
                    ${isConnectSrc  ? 'ring-2 ring-yellow-400' : ''}
                    ${isDropTarget  ? 'ring-2 ring-green-400 shadow-md' : ''}`}
                  onMouseDown={e => handleNodeMouseDown(e, node.id)}
                  onMouseUp={e => handleNodeMouseUp(e, node.id)}
                >
                  {/* Puertos de conexión — arrastrá desde uno para conectar */}
                  {(isSelected || pendingEdge) && (['right','left','bottom','top'] as const).map(side => {
                    const isSrcPort = pendingEdge?.nodeId === node.id && pendingEdge?.lado === side;
                    const pt = getPortPoint(node, side);
                    return (
                      <div
                        key={side}
                        title={`Arrastrá para conectar (${side})`}
                        onMouseDown={e => {
                          e.stopPropagation();
                          setSelectedNodeId(node.id);
                          setSelectedEdgeId(null);
                          setPendingEdge({ nodeId: node.id, lado: side, x: pt.x, y: pt.y });
                        }}
                        onMouseUp={e => {
                          e.stopPropagation();
                          setDragging(null);
                          setPendingDrag(null);
                          if (pendingEdge && pendingEdge.nodeId !== node.id) {
                            crearConexion(pendingEdge.nodeId, node.id, pendingEdge.lado, side);
                            setPendingEdge(null);
                          }
                        }}
                        className={`absolute w-4 h-4 rounded-full border-2 border-white shadow-md z-20 cursor-crosshair transition-all hover:scale-125
                          ${isSrcPort ? 'bg-yellow-400 scale-125' : isDropTarget ? 'bg-green-500 scale-110 animate-pulse' : 'bg-indigo-500'}
                          ${side === 'right'  ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2' : ''}
                          ${side === 'left'   ? 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2' : ''}
                          ${side === 'bottom' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' : ''}
                          ${side === 'top'    ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
                        `}
                      />
                    );
                  })}
                  {/* Integration badge */}
                  {isIntegration && (
                    <div className="absolute -top-2 left-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white ${nt.color}`}>INT</span>
                    </div>
                  )}

                  <div className="flex items-start gap-2 px-3 py-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${nt.color}`}>
                      <nt.icon size={15} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Full text — wraps up to 3 lines */}
                      <div className="text-xs font-semibold text-gray-800 leading-tight break-words line-clamp-3">{node.nombre}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{nt.label}</div>
                    </div>
                    {isSelected && (
                      <button
                        onMouseDown={e => { e.stopPropagation(); const pt = getPortPoint(node, 'right'); setPendingEdge({ nodeId: node.id, lado: 'right', x: pt.x, y: pt.y }); }}
                        className={`p-1 rounded transition-colors flex-shrink-0 ${isConnectSrc ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-indigo-50 text-gray-400 hover:text-indigo-600'}`}
                        title="Conectar a otro nodo"
                      >
                        <Link2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Indicador de conexión en curso */}
          {pendingEdge && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-indigo-50 border border-indigo-300 text-indigo-700 text-xs px-3 py-1.5 rounded-full shadow flex items-center gap-2 z-50 pointer-events-none">
              <Link2 size={11} /> Soltá sobre un nodo para conectar · ESC para cancelar
            </div>
          )}
          {/* Indicador de edge seleccionado */}
          {selectedEdgeId && !pendingEdge && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white border border-indigo-200 text-indigo-700 text-xs px-3 py-1.5 rounded-full shadow flex items-center gap-2 z-50">
              <Settings size={11} /> Arrastrá el rombo para curvar la flecha
              <button onClick={() => setSelectedEdgeId(null)} className="ml-1 hover:text-indigo-900"><X size={11} /></button>
            </div>
          )}

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-center text-gray-400">
                <Plus size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">Arrastrá nodos desde el panel izquierdo</p>
                <p className="text-sm mt-1">Flujos, aprobaciones, integraciones y más</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="w-72 bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto">
          {selectedNode ? (
            <PropertiesPanel
              node={selectedNode}
              getConfig={getConfig}
              updateNodeName={updateNodeName}
              updateNodeConfig={updateNodeConfig}
              onConnect={() => { const pt = getPortPoint(selectedNode, 'right'); setPendingEdge({ nodeId: selectedNode.id, lado: 'right', x: pt.x, y: pt.y }); }}
              onDelete={deleteSelected}
              isConnecting={pendingEdge?.nodeId === selectedNode.id}
            />
          ) : (
            <EmptyPanel nodes={nodes} edges={edges} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Properties Panel ─────────────────────────────────────────────────────────
function PropertiesPanel({
  node, getConfig, updateNodeName, updateNodeConfig, onConnect, onDelete, isConnecting
}: {
  node: FlowNode;
  getConfig: (n: FlowNode, key: string) => string;
  updateNodeName: (v: string) => void;
  updateNodeConfig: (k: string, v: string) => void;
  onConnect: () => void;
  onDelete: () => void;
  isConnecting: boolean;
}) {
  const nt = getNodeType(node.tipoNodo);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${nt.color}`}>
            <nt.icon size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">Propiedades</span>
        </div>
        <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Eliminar nodo">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Tipo */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-white ${nt.color}`}>
          {nt.group === 'integracion' && <Zap size={11} className="opacity-75" />} {nt.label}
        </span>
      </div>

      {/* Nombre */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Nombre del nodo</label>
        <textarea
          value={node.nombre}
          onChange={e => updateNodeName(e.target.value)}
          rows={2}
          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="Nombre descriptivo del paso..."
        />
      </div>

      {/* ── Config by type ── */}
      <ConfigByType node={node} getConfig={getConfig} updateNodeConfig={updateNodeConfig} />

      {/* Actions */}
      <div className="pt-2 border-t border-gray-100 flex gap-2">
        <button
          onMouseDown={e => { e.stopPropagation(); onConnect(); }}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border text-xs rounded-lg transition
            ${isConnecting ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'}`}
        >
          <Link2 size={12} /> {isConnecting ? 'Conectando...' : 'Conectar'}
        </button>
        <button onClick={onDelete} className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 text-xs rounded-lg hover:bg-red-50 transition">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Config panels per node type ──────────────────────────────────────────────
function ConfigByType({ node, getConfig, updateNodeConfig }: {
  node: FlowNode;
  getConfig: (n: FlowNode, key: string) => string;
  updateNodeConfig: (k: string, v: string) => void;
}) {
  const F = (props: { label: string; children: React.ReactNode }) => (
    <div><label className="block text-xs font-medium text-gray-500 mb-1">{props.label}</label>{props.children}</div>
  );
  const Select = (props: { field: string; options: string[]; placeholder?: string }) => (
    <select value={getConfig(node, props.field)} onChange={e => updateNodeConfig(props.field, e.target.value)}
      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
      <option value="">{props.placeholder ?? 'Seleccionar...'}</option>
      {props.options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
  const Input = (props: { field: string; placeholder?: string; type?: string }) => (
    <input type={props.type ?? 'text'} value={getConfig(node, props.field)} onChange={e => updateNodeConfig(props.field, e.target.value)}
      placeholder={props.placeholder}
      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
  );
  const Textarea = (props: { field: string; placeholder?: string; rows?: number }) => (
    <textarea value={getConfig(node, props.field)} onChange={e => updateNodeConfig(props.field, e.target.value)}
      rows={props.rows ?? 2} placeholder={props.placeholder}
      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
  );

  switch (node.tipoNodo) {

    // ── Flujo ──────────────────────────────────────────────────────────────
    case 'aprobacion':
      return (
        <F label="Aprobador (rol)">
          <Select field="rol" options={['Supervisor', 'Administrador', 'Aprobador']} placeholder="Sin especificar" />
        </F>
      );

    case 'email':
      return (
        <div className="space-y-3">
          <F label="Destinatario">
            <Select field="destinatario" options={['Solicitante', 'Técnico asignado', 'Supervisor', 'Todos los involucrados']} />
          </F>
          <F label="Asunto"><Input field="asunto" placeholder="Asunto del email..." /></F>
          <F label="Cuerpo del mensaje"><Textarea field="cuerpo" placeholder="Contenido del email..." rows={3} /></F>
        </div>
      );

    case 'condicional':
      return (
        <div className="space-y-3">
          <F label="Campo a evaluar">
            <Select field="campo" options={['Prioridad', 'Estado', 'Área', 'Categoría', 'Técnico asignado', 'SLA vencido']} />
          </F>
          <F label="Operador">
            <Select field="operador" options={['es igual a', 'no es igual a', 'contiene', 'es mayor que', 'es menor que', 'está vacío', 'no está vacío']} />
          </F>
          <F label="Valor"><Input field="valor" placeholder="Valor a comparar..." /></F>
          <p className="text-xs text-gray-400">Las conexiones se etiquetan automáticamente como Sí / No</p>
        </div>
      );

    case 'tareas':
      return (
        <div className="space-y-3">
          <F label="Asignado a">
            <Select field="asignadoA" options={['Técnico del ticket', 'Supervisor', 'Administrador', 'Rol específico']} />
          </F>
          <F label="Tareas (una por línea)"><Textarea field="tareas" placeholder="Verificar documentación&#10;Crear usuario en AD&#10;Enviar credenciales" rows={4} /></F>
          <F label="¿Bloquea el flujo?">
            <Select field="bloqueante" options={['Sí — espera a que se completen', 'No — continúa en paralelo']} />
          </F>
        </div>
      );

    case 'formulario':
      return (
        <div className="space-y-3">
          <F label="Título del formulario"><Input field="titulo" placeholder="Ej: Datos de recepción" /></F>
          <F label="Campos requeridos"><Textarea field="campos" placeholder="Número de remito&#10;Cantidad recibida&#10;Observaciones" rows={3} /></F>
          <F label="Completa por">
            <Select field="completadoPor" options={['Solicitante', 'Técnico asignado', 'Supervisor', 'Cualquier usuario']} />
          </F>
        </div>
      );

    case 'inicio':
      return (
        <div className="space-y-3">
          <F label="Disparador">
            <Select field="disparador" options={['Ticket creado', 'Ticket asignado', 'Ticket escalado', 'Estado cambiado', 'Manual']} />
          </F>
          <F label="Descripción del proceso"><Textarea field="descripcion" placeholder="¿Qué proceso describe este workflow?" rows={2} /></F>
        </div>
      );

    // ── Integración SAP ────────────────────────────────────────────────────
    case 'int-sap':
      return (
        <div className="space-y-3">
          <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700 font-medium flex items-center gap-1.5">
            <Database size={12} /> Integración SAP
          </div>
          <F label="Módulo SAP">
            <Select field="modulo" options={['MM — Gestión de materiales', 'FI — Finanzas', 'SD — Ventas', 'CO — Controlling', 'HR — RRHH', 'PP — Planificación', 'WM — Almacén']} />
          </F>
          <F label="Transacción / Operación">
            <Select field="transaccion" options={[
              'ME21N — Crear Pedido', 'ME22N — Modificar Pedido', 'ME23N — Ver Pedido',
              'MIGO — Entrada de Mercancías', 'MIRO — Verificación de Facturas',
              'FB60 — Factura Proveedor', 'VL01N — Entrega', 'VA01 — Crear Orden de Venta',
              'PA40 — Acción de Personal', 'Personalizada'
            ]} />
          </F>
          <F label="Documento de referencia"><Input field="docReferencia" placeholder="Ej: Nro. de Pedido / OC..." /></F>
          <F label="Notas / Descripción"><Textarea field="notas" placeholder="Instrucciones o descripción del paso..." rows={2} /></F>
        </div>
      );

    // ── Integración WMS ────────────────────────────────────────────────────
    case 'int-wms':
      return (
        <div className="space-y-3">
          <div className="bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-700 font-medium flex items-center gap-1.5">
            <Package size={12} /> Integración WMS
          </div>
          <F label="Operación">
            <Select field="operacion" options={[
              'Recepción de producto', 'Expedición / Despacho', 'Transferencia interna',
              'Inventario / Conteo', 'Ajuste de stock', 'Devolución a proveedor',
              'Picking / Preparación', 'Confirmación de entrega'
            ]} />
          </F>
          <F label="Depósito / Almacén"><Input field="deposito" placeholder="Ej: Depósito Central, Planta B..." /></F>
          <F label="Referencia de documento"><Input field="referencia" placeholder="Ej: Nro. de remito, OC, guía..." /></F>
          <F label="Notas"><Textarea field="notas" placeholder="Instrucciones adicionales..." rows={2} /></F>
        </div>
      );

    // ── REST API ───────────────────────────────────────────────────────────
    case 'int-rest':
      return (
        <div className="space-y-3">
          <div className="bg-teal-50 rounded-lg px-3 py-2 text-xs text-teal-700 font-medium flex items-center gap-1.5">
            <Globe size={12} /> REST API
          </div>
          <F label="Método HTTP">
            <Select field="metodo" options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE']} />
          </F>
          <F label="URL del endpoint"><Input field="url" placeholder="https://api.ejemplo.com/endpoint" /></F>
          <F label="Headers (JSON)"><Textarea field="headers" placeholder={'{"Authorization": "Bearer {{token}}", "Content-Type": "application/json"}'} rows={2} /></F>
          <F label="Body (JSON — para POST/PUT)"><Textarea field="body" placeholder={'{"campo": "{{valor}}"}'} rows={2} /></F>
          <F label="¿Esperar respuesta?">
            <Select field="esperarRespuesta" options={['Sí — continúa con la respuesta', 'No — dispara y continúa']} />
          </F>
        </div>
      );

    // ── Base de Datos ──────────────────────────────────────────────────────
    case 'int-bd':
      return (
        <div className="space-y-3">
          <div className="bg-purple-50 rounded-lg px-3 py-2 text-xs text-purple-700 font-medium flex items-center gap-1.5">
            <Database size={12} /> Base de Datos
          </div>
          <F label="Tipo de operación">
            <Select field="operacion" options={['SELECT — Consulta', 'INSERT — Insertar', 'UPDATE — Actualizar', 'DELETE — Eliminar', 'Stored Procedure']} />
          </F>
          <F label="Base de datos / Conexión"><Input field="conexion" placeholder="Ej: BD_Produccion, SQL_Server_01..." /></F>
          <F label="Tabla / Vista"><Input field="tabla" placeholder="Ej: dbo.Pedidos, vw_Stock..." /></F>
          <F label="Query / Descripción"><Textarea field="query" placeholder="Descripción del query o nombre del SP..." rows={3} /></F>
        </div>
      );

    // ── Webhook ────────────────────────────────────────────────────────────
    case 'int-webhook':
      return (
        <div className="space-y-3">
          <div className="bg-yellow-50 rounded-lg px-3 py-2 text-xs text-yellow-700 font-medium flex items-center gap-1.5">
            <Zap size={12} /> Webhook saliente
          </div>
          <F label="URL del webhook"><Input field="url" placeholder="https://hooks.ejemplo.com/..." /></F>
          <F label="Método">
            <Select field="metodo" options={['POST', 'PUT', 'GET']} />
          </F>
          <F label="Payload (JSON)"><Textarea field="payload" placeholder={'{"evento": "ticket_creado", "id": "{{ticketId}}"}'} rows={3} /></F>
          <F label="Autenticación">
            <Select field="auth" options={['Sin autenticación', 'API Key en header', 'Bearer Token', 'Basic Auth']} />
          </F>
          <F label="Secret / Token"><Input field="secret" placeholder="Token de autenticación..." /></F>
        </div>
      );

    // ── Microsoft Teams ────────────────────────────────────────────────────
    case 'int-teams':
      return (
        <div className="space-y-3">
          <div className="bg-indigo-50 rounded-lg px-3 py-2 text-xs text-indigo-700 font-medium flex items-center gap-1.5">
            <MessageSquare size={12} /> Microsoft Teams
          </div>
          <F label="Acción">
            <Select field="accion" options={['Enviar mensaje al canal', 'Notificar al responsable', 'Crear reunión', 'Publicar tarjeta adaptable']} />
          </F>
          <F label="Canal / Equipo"><Input field="canal" placeholder="Ej: IT-Soporte, General..." /></F>
          <F label="Webhook URL del canal"><Input field="webhookUrl" placeholder="https://outlook.office.com/webhook/..." /></F>
          <F label="Mensaje"><Textarea field="mensaje" placeholder="El ticket #{{numero}} fue asignado a {{tecnico}}." rows={3} /></F>
        </div>
      );

    // ── Slack ──────────────────────────────────────────────────────────────
    case 'int-slack':
      return (
        <div className="space-y-3">
          <div className="bg-purple-50 rounded-lg px-3 py-2 text-xs text-purple-700 font-medium flex items-center gap-1.5">
            <Hash size={12} /> Slack
          </div>
          <F label="Acción">
            <Select field="accion" options={['Enviar mensaje al canal', 'Mensaje directo al usuario', 'Publicar bloque']} />
          </F>
          <F label="Canal"><Input field="canal" placeholder="Ej: #soporte-it, #alertas..." /></F>
          <F label="Webhook URL"><Input field="webhookUrl" placeholder="https://hooks.slack.com/services/..." /></F>
          <F label="Mensaje"><Textarea field="mensaje" placeholder="*Ticket #{{numero}}*: {{asunto}}" rows={3} /></F>
        </div>
      );

    // ── Active Directory ───────────────────────────────────────────────────
    case 'int-ad':
      return (
        <div className="space-y-3">
          <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium flex items-center gap-1.5">
            <Users size={12} /> Active Directory
          </div>
          <F label="Operación">
            <Select field="operacion" options={[
              'Crear usuario', 'Deshabilitar usuario', 'Habilitar usuario',
              'Restablecer contraseña', 'Mover a OU', 'Agregar a grupo',
              'Quitar de grupo', 'Sincronizar atributos', 'Consultar usuario'
            ]} />
          </F>
          <F label="Dominio"><Input field="dominio" placeholder="empresa.local, corp.empresa.com..." /></F>
          <F label="OU (Organizational Unit)"><Input field="ou" placeholder="OU=Usuarios,DC=empresa,DC=local" /></F>
          <F label="Notas"><Textarea field="notas" placeholder="Descripción adicional de la operación..." rows={2} /></F>
        </div>
      );

    // ── Excel / CSV ────────────────────────────────────────────────────────
    case 'int-excel':
      return (
        <div className="space-y-3">
          <div className="bg-green-50 rounded-lg px-3 py-2 text-xs text-green-700 font-medium flex items-center gap-1.5">
            <Table2 size={12} /> Excel / CSV
          </div>
          <F label="Operación">
            <Select field="operacion" options={['Exportar datos a Excel', 'Importar desde Excel', 'Exportar a CSV', 'Importar desde CSV', 'Generar reporte']} />
          </F>
          <F label="Nombre del archivo"><Input field="archivo" placeholder="Ej: reporte_tickets_{{fecha}}.xlsx" /></F>
          <F label="Hoja / Pestaña"><Input field="hoja" placeholder="Ej: Datos, Sheet1..." /></F>
          <F label="Columnas / Campos"><Textarea field="campos" placeholder="Número, Asunto, Prioridad, Técnico, Fecha Cierre..." rows={2} /></F>
          <F label="Destino">
            <Select field="destino" options={['Descargar en el ticket', 'Enviar por email', 'Guardar en carpeta compartida', 'SharePoint']} />
          </F>
        </div>
      );

    default:
      return null;
  }
}

// ─── Empty panel ──────────────────────────────────────────────────────────────
function EmptyPanel({ nodes, edges }: { nodes: FlowNode[]; edges: FlowEdge[] }) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings size={14} className="text-gray-400" />
        <span className="text-sm font-medium text-gray-500">Propiedades</span>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">Seleccioná un nodo para ver y editar sus propiedades.</p>
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Nodos</span><span className="font-semibold">{nodes.length}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Conexiones</span><span className="font-semibold">{edges.length}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Integraciones</span>
          <span className="font-semibold">{nodes.filter(n => n.tipoNodo.startsWith('int-')).length}</span>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-500 mb-2">Atajos</p>
        <div className="space-y-1.5 text-xs text-gray-400">
          <div className="flex gap-2"><kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">Drag</kbd> Mover nodo</div>
          <div className="flex gap-2"><kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs"><Link2 size={10} className="inline" /></kbd> Conectar nodos</div>
          <div className="flex gap-2"><kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">Scroll</kbd> Zoom</div>
          <div className="flex gap-2"><kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">Drag canvas</kbd> Navegar</div>
          <div className="flex gap-2"><kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">Clic flecha</kbd> Eliminar conexión</div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-500 mb-2">Variables disponibles</p>
        <div className="space-y-1 text-xs font-mono text-gray-400">
          {['{{ticketId}}', '{{numero}}', '{{asunto}}', '{{tecnico}}', '{{solicitante}}', '{{prioridad}}', '{{fecha}}'].map(v => (
            <div key={v} className="bg-gray-50 rounded px-2 py-0.5">{v}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
