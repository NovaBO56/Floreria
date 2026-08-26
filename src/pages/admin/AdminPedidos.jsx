import { useEffect, useState } from 'react';
import PedidoCard from '../../components/admin/PedidoCard';
import { subscribeToPedidosPendientes, confirmarPedido, rechazarPedido } from '../../services/pedidoAdminService';
import { useAuth } from '../../context/AuthContext';
import '../../components/admin/PedidoCard.css';
export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    return subscribeToPedidosPendientes(setPedidos);
  }, []);

  async function handleConfirmar(pedidoId) {
    await confirmarPedido(pedidoId, currentUser.uid);
  }

  async function handleRechazar(pedidoId) {
    await rechazarPedido(pedidoId, currentUser.uid);
  }

  return (
    <div className="admin-pedidos">
      <h1>Pedidos pendientes ({pedidos.length})</h1>

      {pedidos.length === 0 ? (
        <p>No hay pedidos pendientes.</p>
      ) : (
        <div className="pedidos-lista">
          {pedidos.map((pedido) => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              onConfirmar={handleConfirmar}
              onRechazar={handleRechazar}
            />
          ))}
        </div>
      )}
    </div>
  );
}