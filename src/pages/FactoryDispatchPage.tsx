import { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import { useReactToPrint } from "react-to-print";
import FullInvoicePrint from "../components/FullInvoicePrint";
import {
  Truck,
  Zap,
  Plus,
  Search,
  Building2,
  X,
  TrendingDown,
  ArrowRight,
  ClipboardList,
  RotateCcw,
  Trash2,
  Printer,
} from "lucide-react";
import "./InventoryPage.css";
import { toast } from "react-toastify";
import SearchableSelect from "../components/SearchableSelect";

interface Vendor {
  vendor_id: number;
  name_en: string;
  type: string;
}

interface MenuItem {
  menu_item_id: number;
  name_en: string;
  current_stock: number;
  price: number;
}

const FactoryDispatchPage = () => {
  const [activeTab, setActiveTab] = useState<
    "produce" | "dispatch" | "returns"
  >("dispatch");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [productionLogs, setProductionLogs] = useState<any[]>([]);
  const [returnsHistory, setReturnsHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [showProduceModal, setShowProduceModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const [produceForm, setProduceForm] = useState({
    production_date: new Date().toISOString().split("T")[0],
    expiry_date: "",
    items: [] as any[],
  });

  const [returnForm, setReturnForm] = useState({
    vendor_id: "",
    branch_id: "",
    sale_id: "",
    reason: "Expired / Unsold",
    items: [] as any[],
  });

  const [printReturnData, setPrintReturnData] = useState<{order: any, items: any[]} | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Return_Receipt",
    onAfterPrint: () => setPrintReturnData(null)
  });

  const printReturn = async (returnRecord: any) => {
    const toastId = toast.loading('Preparing document for print...');
    try {
      const res = await api.get(`/factory/returns/${returnRecord.return_id}/items`);
      if (res.data.success) {
        setPrintReturnData({
          order: {
             sale_id: returnRecord.return_id,
             customer_name: returnRecord.client_name,
             dispatch_date: new Date(returnRecord.created_at).toLocaleDateString('en-GB'),
             final_amount: returnRecord.total_credit_amount,
             discount_amount: 0
          },
          items: res.data.data
        });
        toast.dismiss(toastId);
        setTimeout(() => {
          handlePrintAction();
        }, 300);
      } else {
        toast.update(toastId, { render: 'Failed to fetch print data', type: 'error', isLoading: false, autoClose: 3000 });
      }
    } catch (error) {
      toast.update(toastId, { render: 'API Error: Failed to load return items', type: 'error', isLoading: false, autoClose: 3000 });
    }
  };

  const selectedVendor = vendors.find(v => String(v.vendor_id) === String(returnForm.vendor_id));
  
  const vendorDispatches = dispatches
    .filter(d => {
      // 🕵️‍♂️ MATCH BY ID OR BY NAME (FOR OLD RECORDS)
      const vendorMatch = returnForm.vendor_id && (
        String(d.vendor_id) === String(returnForm.vendor_id) || 
        d.client_name === selectedVendor?.name_en || 
        d.customer_name === selectedVendor?.name_en
      );

      // 🏢 IF BRANCH IS MAIN OR NULL, SHOW IN MAIN OFFICE
      const branchMatch = !returnForm.branch_id || 
                         (returnForm.branch_id === 'main' && (!d.branch_id || d.branch_id === 'main')) || 
                         String(d.branch_id) === String(returnForm.branch_id);

      return vendorMatch && branchMatch;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleReturnSaleSelect = async (saleId: string) => {
    if (!saleId) return;
    try {
      const res = await api.get(`/sales/${saleId}`);
      if (res.data.success) {
        const saleItems = res.data.data.items || [];
        setReturnForm({
          ...returnForm,
          sale_id: saleId,
          items: saleItems.map((i: any) => ({
             ...i,
             original_quantity: i.quantity_delivered || i.quantity,
             quantity: 0 
          }))
        });
      }
    } catch (e) {
      toast.error("Failed to load items from this dispatch.");
    }
  };

  const [dispatchForm, setDispatchForm] = useState({
    vendor_id: "",
    batch_number: "",
    expiry_date: "",
    items: [] as any[],
    payment_method: "credit",
    discount_percentage: 0,
    dispatch_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchBaseData();
  }, [activeTab]);

  const fetchBaseData = async () => {
    try {
      const results: any = await Promise.all([
        api.get("/vendors").catch(() => ({ data: { data: [] } })),
        api.get("/menu").catch(() => ({ data: { data: [] } })),
        api.get("/factory/dispatches").catch(() => ({ data: { data: [] } })),
        api.get("/factory/production/logs").catch(() => ({ data: { data: [] } })),
        api.get("/factory/returns").catch(() => ({ data: { data: [] } })),
      ]);

      const vArr = results[0].data.data || results[0].data;
      const mArr = results[1].data.data || results[1].data;
      const dArr = results[2].data.data || results[2].data;
      const pArr = (results[3].data.data || results[3].data).filter(
        (p: any) => p.batch_number,
      );
      const rArr = results[4].data.data || results[4].data;

      setVendors(Array.isArray(vArr) ? vArr : []);
      // 🛡️ ONLY SHOW FINISHED PRODUCTS (SELLING) IN DISTRIBUTION
      setMenuItems(Array.isArray(mArr) ? mArr.filter((i: any) => i.type === 'selling') : []);
      setDispatches(Array.isArray(dArr) ? dArr : []);
      setProductionLogs(Array.isArray(pArr) ? pArr : []);
      setReturnsHistory(Array.isArray(rArr) ? rArr : []);
    } catch (e) {
      console.error("Fetch Error:", e);
    }
  };

  const handleBatchSelect = (batchNum: string) => {
    const batch = productionLogs.find((p) => p.batch_number === batchNum);
    if (batch) {
      setDispatchForm({
        ...dispatchForm,
        batch_number: batchNum,
        expiry_date: batch.expiry_date.split("T")[0],
      });
    }
  };

  const addItemToBatch = (item: MenuItem) => {
    if (produceForm.items.find((i) => i.menu_item_id === item.menu_item_id))
      return;
    setProduceForm({
      ...produceForm,
      items: [...produceForm.items, { ...item, quantity: 100 }],
    });
  };

  const handleProduceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (produceForm.items.length === 0)
      return toast.warning("Please add items to the production batch.");
    if (!produceForm.expiry_date)
      return toast.warning("Missing expiry date for the batch.");

    try {
      await api.post("/factory/production/batch", produceForm);
      toast.success("Production Batch Recorded Successfully! 🏭");
      setShowProduceModal(false);
      setProduceForm({
        production_date: new Date().toISOString().split("T")[0],
        expiry_date: "",
        items: [],
      });
      fetchBaseData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to record production.",
      );
    }
  };

  const removeFromProduce = (id: number) => {
    setProduceForm({
      ...produceForm,
      items: produceForm.items.filter((i) => i.menu_item_id !== id),
    });
  };

  const handleDeleteProduction = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this production batch? This will NOT restore used stock automatically.")) return;
    try {
      await api.delete(`/factory/production/batch/${id}`);
      toast.success("Production batch deleted! 🗑️");
      fetchBaseData();
    } catch (e) {
      toast.error("Failed to delete production batch.");
    }
  };

  const handleDeleteDispatch = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this dispatch order?")) return;
    try {
      await api.delete(`/factory/sales/${id}`);
      toast.success("Dispatch order deleted! 🗑️");
      fetchBaseData();
    } catch (e) {
      toast.error("Failed to delete dispatch order.");
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    const toastId = toast.loading(`Updating status to ${status}...`);
    try {
      const res = await api.put(`/factory/dispatches/${id}/status`, { status });
      if (res.data.success) {
        toast.update(toastId, { render: `Order marked as ${status}! ✅`, type: "success", isLoading: false, autoClose: 3000 });
        await fetchBaseData();
      } else {
        toast.update(toastId, { render: res.data.message || "Failed to update status", type: "error", isLoading: false, autoClose: 3000 });
      }
    } catch (e: any) {
      console.error(e);
      toast.update(toastId, { render: e.response?.data?.message || "Server error occurred", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const removeFromDispatch = (id: number) => {
    setDispatchForm({
      ...dispatchForm,
      items: dispatchForm.items.filter((i) => i.menu_item_id !== id),
    });
  };

  const removeFromReturn = (id: number) => {
    setReturnForm({
      ...returnForm,
      items: returnForm.items.filter((i) => i.menu_item_id !== id),
    });
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnForm.vendor_id) return toast.warning("Please select a vendor.");
    if (returnForm.items.length === 0) return toast.warning("Please add items to the return list.");
    
    try {
      await api.post("/factory/returns", {
        ...returnForm,
        items: returnForm.items.map(i => ({
          menu_item_id: i.menu_item_id,
          quantity: i.quantity,
          unit_price: i.price,
          expiry_date: i.expiry_date || null
        }))
      });
      toast.success("Return Processed & Wastage Recorded! 🔄");
      setShowReturnModal(false);
      setReturnForm({ vendor_id: "", sale_id: "", reason: "Expired / Unsold", items: [] });
      fetchBaseData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to process return.");
    }
  };

  const addItemToReturn = (item: MenuItem) => {
    if (returnForm.items.find((i) => i.menu_item_id === item.menu_item_id))
      return;
    setReturnForm({
      ...returnForm,
      items: [...returnForm.items, { ...item, quantity: 1 }],
    });
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/factory/sales", dispatchForm);
      toast.success("Goods Dispatched & Linked to Batch! 🚛");
      setShowDispatchModal(false);
      setDispatchForm({
        vendor_id: "",
        batch_number: "",
        expiry_date: "",
        items: [],
        payment_method: "credit",
        discount_percentage: 0,
        dispatch_date: new Date().toISOString().split("T")[0],
      });
      fetchBaseData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Dispatch operation failed.",
      );
    }
  };

  const addItemToDispatch = (item: MenuItem) => {
    if (dispatchForm.items.find((i) => i.menu_item_id === item.menu_item_id))
      return;
    setDispatchForm({
      ...dispatchForm,
      items: [...dispatchForm.items, { ...item, quantity: 1 }],
    });
  };

  return (
    <Layout title="Production & Distribution Hub">
      <div className="inventory-container">
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "2rem",
            marginBottom: "2rem",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "0.5rem",
          }}
        >
          <button
            onClick={() => setActiveTab("dispatch")}
            style={{
              background: "none",
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 4px",
              fontWeight: 700,
              fontSize: "15px",
              color: activeTab === "dispatch" ? "var(--primary)" : "#64748b",
              borderBottom:
                activeTab === "dispatch" ? "3px solid var(--primary)" : "none",
              cursor: "pointer",
            }}
          >
            <Truck size={20} /> Client Distribution
          </button>
          <button
            onClick={() => setActiveTab("produce")}
            style={{
              background: "none",
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 4px",
              fontWeight: 700,
              fontSize: "15px",
              color: activeTab === "produce" ? "var(--primary)" : "#64748b",
              borderBottom:
                activeTab === "produce" ? "3px solid var(--primary)" : "none",
              cursor: "pointer",
            }}
          >
            <Zap size={20} /> Batch Production
          </button>
          <button
            onClick={() => setActiveTab("returns")}
            style={{
              background: "none",
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 4px",
              fontWeight: 700,
              fontSize: "15px",
              color: activeTab === "returns" ? "var(--primary)" : "#64748b",
              borderBottom:
                activeTab === "returns" ? "3px solid var(--primary)" : "none",
              cursor: "pointer",
            }}
          >
            <TrendingDown size={20} /> Returns & Wastage
          </button>
        </div>

        {/* Toolbar */}
        <div className="inventory-actions">
          <div className="search-group">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search orders or batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="action-buttons">
            <button
              className="btn-add"
              style={{ background: "var(--primary)" }}
              onClick={() => setShowProduceModal(true)}
            >
              <Plus size={18} /> New Production Batch
            </button>
            <button
              className="btn-add"
              style={{ background: "#0369a1" }}
              onClick={() => setShowDispatchModal(true)}
            >
              <Truck size={18} /> Create Dispatch
            </button>
            <button
              className="btn-add"
              style={{ background: "#be123c" }}
              onClick={() => {
                fetchBaseData();
                setShowReturnModal(true);
              }}
            >
              <RotateCcw size={18} /> Process Sales Return
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 350px",
            gap: "2rem",
          }}
        >
          <div className="stock-table-card">
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <strong>
                {activeTab === "dispatch"
                  ? "Internal Distribution"
                  : "Factory Production History"}
              </strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Real-time Traceability
              </span>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  {activeTab === "dispatch" ? (
                    <tr>
                      <th>SO #</th>
                      <th>Distribution Partner</th>
                      <th>Status</th>
                      <th>Dispatch Date</th>
                      <th className="text-right">Action</th>
                    </tr>
                  ) : activeTab === "returns" ? (
                    <tr>
                      <th>Return ID</th>
                      <th>Client Name</th>
                      <th>Reason</th>
                      <th>Return Date</th>
                      <th className="text-right">Wastage Value (Loss)</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  ) : (
                    <tr>
                      <th>Batch Code</th>
                      <th>Mfd Date</th>
                      <th>Exp Date</th>
                      <th>Line Count</th>
                      <th className="text-right">Batch Size</th>
                      <th className="text-right">Action</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {activeTab === "dispatch" ? (
                    dispatches.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4">
                          No distributions found.
                        </td>
                      </tr>
                    ) : (
                      dispatches.map((d) => (
                        <tr key={d.sale_id}>
                          <td>
                            <div style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: '4px' }}>{d.order_number}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                               Batch: {d.batch_number || 'N/A'}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700 }}>
                              {d.client_name}
                            </div>
                            {d.branch_name && (
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "var(--primary)",
                                }}
                              >
                                {d.branch_name} Branch
                              </div>
                            )}
                          </td>
                          <td>
                            <span
                              className={`status-badge ${d.dispatch_status === "pending" ? "low" : (d.dispatch_status === "in_transit" || d.dispatch_status === "dispatched") ? "warning" : "healthy"}`}
                            >
                              {d.dispatch_status === "in_transit" ? "dispatched" : d.dispatch_status}
                            </span>
                          </td>
                          <td>{d.dispatch_date}</td>
                          <td className="text-right">
                            <div
                              style={{
                                display: "flex",
                                gap: "5px",
                                justifyContent: "flex-end",
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{ fontWeight: 700, marginRight: "5px" }}
                              >
                                {Number(d.total_amount).toFixed(3)} KWD
                              </span>
                              {(d.dispatch_status === "in_transit" || d.dispatch_status === "dispatched") && (
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(d.sale_id, "delivered")
                                  }
                                  className="btn-success"
                                  style={{
                                    padding: "4px 8px",
                                    fontSize: "10px",
                                  }}
                                >
                                  Deliver
                                </button>
                              )}
                               <button 
                                 onClick={() => handleDeleteDispatch(d.sale_id)} 
                                 className="btn-icon" 
                                 style={{ background: '#fff1f2', color: '#be123c', border: 'none', padding: '6px', cursor: 'pointer' }}
                               >
                                 <Trash2 size={16} />
                               </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  ) : activeTab === "returns" ? (
                    returnsHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4">
                          No returns recorded.
                        </td>
                      </tr>
                    ) : (
                      returnsHistory.map((r: any) => (
                        <tr key={r.return_id}>
                          <td>
                            <span style={{ fontWeight: 700 }}>
                              #RET-{r.return_id}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{r.client_name}</div>
                            {r.branch_name && (
                              <div style={{ fontSize: '11px', color: 'var(--primary)' }}>{r.branch_name} Branch</div>
                            )}
                          </td>
                          <td>
                            <span
                              className="status-badge low"
                              style={{
                                textTransform: "none",
                                background: "#fff1f2",
                                color: "#be123c",
                              }}
                            >
                              {r.reason}
                            </span>
                          </td>
                          <td>{new Date(r.created_at).toLocaleDateString()}</td>
                          <td className="text-right">
                            <strong style={{ color: '#be123c' }}>
                              {Number(r.total_credit_amount).toFixed(3)} KWD
                            </strong>
                          </td>
                          <td className="text-center">
                             <button onClick={() => printReturn(r)} className="btn-icon" style={{ padding: '6px', cursor: 'pointer', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                <Printer size={16} />
                             </button>
                          </td>
                        </tr>
                      ))
                    )
                  ) : productionLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        Wait for production run.
                      </td>
                    </tr>
                  ) : (
                    productionLogs
                      .filter((p) => 
                        p.batch_number && 
                        (p.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (p.product_summary && p.product_summary.toLowerCase().includes(searchTerm.toLowerCase())))
                      )
                      .map((p) => (
                        <tr key={p.production_id}>
                          <td>
                            <div
                              style={{
                                fontWeight: 700,
                                color: "var(--primary)",
                                fontSize: "14px",
                              }}
                            >
                              {p.batch_number}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#64748b",
                                marginTop: "4px",
                                lineHeight: "1.4",
                                maxWidth: "300px",
                              }}
                            >
                              {p.product_summary
                                ? p.product_summary
                                : "Loading details..."}
                            </div>
                          </td>
                          <td>
                            {p.branch_id ? (
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)' }}>
                                {vendors.find(v => (v as any).branches?.some((b: any) => String(b.branch_id) === String(p.branch_id)))?.name_en} 
                                {(() => {
                                  const vendor = vendors.find(v => (v as any).branches?.some((b: any) => String(b.branch_id) === String(p.branch_id)));
                                  const branch = (vendor as any)?.branches?.find((b: any) => String(b.branch_id) === String(p.branch_id));
                                  return branch ? ` / ${branch.name_en}` : '';
                                })()}
                              </div>
                            ) : (
                              <div style={{ fontSize: '12px', color: '#94a3b8 italic' }}>Global/Main</div>
                            )}
                            <div style={{ fontSize: '11px' }}>{p.production_date}</div>
                          </td>
                          <td>
                            <span style={{ color: "#be123c", fontWeight: 600 }}>
                              {p.expiry_date}
                            </span>
                          </td>
                          <td>{p.total_items} types</td>
                          <td className="text-right">
                               <strong>{p.total_qty} units</strong>
                           </td>
                           <td className="text-right">
                             <button 
                               onClick={() => handleDeleteProduction(p.production_id)} 
                               className="btn-icon"
                               style={{ background: '#fff1f2', color: '#be123c', border: 'none', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                             >
                               <Trash2 size={16} />
                             </button>
                           </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            <div
              style={{
                background: "#ecfdf5",
                border: "1px solid #6ee7b7",
                padding: "1.5rem",
                borderRadius: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: "#047857",
                  marginBottom: "10px",
                  fontWeight: 800,
                }}
              >
                <ClipboardList size={20} /> Traceability Live
              </div>
              <p style={{ fontSize: "13px", color: "#047857" }}>
                All current dispatches are linked to valid production batches.
              </p>
            </div>
            <div
              style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "20px",
                border: "1px solid #f1f5f9",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: "#1e293b",
                  marginBottom: "15px",
                  fontWeight: 800,
                }}
              >
                <Zap size={20} /> Efficiency
              </div>
              <div
                style={{
                  background: "#f8fafc",
                  padding: "10px",
                  borderRadius: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                  }}
                >
                  <span>System Uptime</span>
                  <strong>100%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Production Modal */}
      {showProduceModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "900px" }}>
            <div className="modal-header">
              <h3>
                <Zap
                  size={22}
                  style={{ color: "#f59e0b", marginRight: "10px" }}
                />{" "}
                Record Production Batch
              </h3>
              <button
                className="btn-close"
                onClick={() => setShowProduceModal(false)}
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleProduceSubmit}>
              <div className="modal-body">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <div className="form-group">
                    <label>Mfd Date</label>
                    <input
                      type="date"
                      value={produceForm.production_date}
                      onChange={(e) =>
                        setProduceForm({
                          ...produceForm,
                          production_date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="date"
                      value={produceForm.expiry_date}
                      onChange={(e) =>
                        setProduceForm({
                          ...produceForm,
                          expiry_date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1fr",
                    gap: "20px",
                  }}
                >
                  <div
                    style={{
                      background: "#f8fafc",
                      padding: "15px",
                      borderRadius: "15px",
                      maxHeight: "400px",
                      overflowY: "auto",
                    }}
                  >
                    <h4 style={{ fontSize: "13px", marginBottom: "15px" }}>
                      Product Catalog
                    </h4>
                    {menuItems.map((item) => (
                      <div
                        key={item.menu_item_id}
                        onClick={() => addItemToBatch(item)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "10px",
                          background: "white",
                          borderRadius: "10px",
                          cursor: "pointer",
                          border: "1px solid #f1f5f9",
                          marginBottom: "8px",
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{item.name_en}</span>
                        <span
                          style={{ fontSize: "12px", color: "var(--primary)" }}
                        >
                          Stock: {item.current_stock}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      background: "white",
                      border: "1px solid #f1f5f9",
                      padding: "15px",
                      borderRadius: "15px",
                    }}
                  >
                    <h4 style={{ fontSize: "13px", marginBottom: "15px" }}>
                      Batch Composition
                    </h4>
                    {produceForm.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "10px",
                        }}
                      >
                        <div style={{ flex: 1, fontSize: "13px" }}>
                          {item.name_en}
                        </div>
                        <input
                          type="number"
                          style={{ width: "80px", padding: "6px" }}
                          value={item.quantity}
                          onChange={(e) => {
                            const n = [...produceForm.items];
                            n[idx].quantity = e.target.value;
                            setProduceForm({ ...produceForm, items: n });
                          }}
                        />
                        <button 
                          type="button" 
                          onClick={() => removeFromProduce(item.menu_item_id)}
                          style={{ background: 'none', border: 'none', color: '#be123c', cursor: 'pointer', padding: '5px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowProduceModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: "var(--primary)" }}
                >
                  Complete Production Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Modal - WITH BATCH SELECT */}
      {showDispatchModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "800px" }}>
            <div className="modal-header">
              <h3>
                <Truck
                  size={22}
                  style={{ color: "#0369a1", marginRight: "10px" }}
                />{" "}
                Client Distribution Dispatch
              </h3>
              <button
                className="btn-close"
                onClick={() => setShowDispatchModal(false)}
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleDispatch}>
              <div className="modal-body">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 0.6fr 0.8fr",
                    gap: "1rem",
                    marginBottom: "20px",
                  }}
                >
                  <div className="form-group">
                    <label>
                      <Building2 size={14} /> Client / Partner
                    </label>
                    <SearchableSelect
                      options={vendors
                        .filter((v) => v.type === "client" || v.type === "supplier")
                        .map((v: any) => ({ value: v.vendor_id, label: v.name_en }))}
                      value={dispatchForm.vendor_id}
                      onChange={(val) =>
                        setDispatchForm({
                          ...dispatchForm,
                          vendor_id: String(val),
                          branch_id: "",
                        } as any)
                      }
                      placeholder="Choose Client..."
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <ArrowRight size={14} /> Target Branch
                    </label>
                    <SearchableSelect
                      options={[
                        { value: 'main', label: 'Main / Corporate Office' },
                        ...((vendors.find((v: any) => v.vendor_id === Number(dispatchForm.vendor_id)) as any)?.branches?.map((br: any) => ({
                          value: br.branch_id,
                          label: br.name_en
                        })) || [])
                      ]}
                      value={(dispatchForm as any).branch_id}
                      onChange={(val) =>
                        setDispatchForm({
                          ...dispatchForm,
                          branch_id: String(val),
                        } as any)
                      }
                      placeholder="Choose Branch..."
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <Zap size={14} /> Production Batch
                    </label>
                    <SearchableSelect
                      options={productionLogs
                        .filter(p => {
                          const fBranch = dispatchForm.branch_id === 'main' ? null : dispatchForm.branch_id;
                          const pBranch = p.branch_id === 'main' ? null : p.branch_id;
                          return !dispatchForm.branch_id || String(pBranch) === String(fBranch);
                        })
                        .map((p) => ({
                          value: p.batch_number,
                          label: `${p.batch_number} (Exp: ${new Date(p.expiry_date).toLocaleDateString()})`
                        }))}
                      value={dispatchForm.batch_number}
                      onChange={(val) => handleBatchSelect(String(val))}
                      placeholder="Choose Batch..."
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <Zap size={14} color="#f59e0b" /> Discount (%)
                    </label>
                    <input 
                      type="number"
                      placeholder="0"
                      value={dispatchForm.discount_percentage}
                      onChange={(e) => setDispatchForm({...dispatchForm, discount_percentage: Number(e.target.value)})}
                      className="po-table-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <ClipboardList size={14} /> Dispatch Date
                    </label>
                    <input 
                      type="date"
                      value={dispatchForm.dispatch_date}
                      onChange={(e) => setDispatchForm({...dispatchForm, dispatch_date: e.target.value})}
                      className="po-table-input"
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                  }}
                >
                  <div
                    style={{
                      background: "#f8fafc",
                      padding: "15px",
                      borderRadius: "15px",
                    }}
                  >
                    <h4 style={{ fontSize: "13px", marginBottom: "15px" }}>
                      Finished Product Stock
                    </h4>
                    {menuItems.map((item) => (
                      <div
                        key={item.menu_item_id}
                        onClick={() => addItemToDispatch(item)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "10px",
                          background: "white",
                          borderRadius: "10px",
                          cursor: "pointer",
                          border: "1px solid #f1f5f9",
                          marginBottom: "8px",
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{item.name_en}</span>
                        <span
                          style={{ fontSize: "12px", color: "var(--primary)" }}
                        >
                          Stock: {item.current_stock}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      background: "white",
                      border: "1px solid #f1f5f9",
                      padding: "15px",
                      borderRadius: "15px",
                    }}
                  >
                    <h4 style={{ fontSize: "13px", marginBottom: "15px" }}>
                      Loading for Partner
                    </h4>
                    {dispatchForm.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "10px",
                        }}
                      >
                        <div style={{ flex: 1, fontSize: "13px" }}>
                          {item.name_en}
                        </div>
                        <input
                          type="number"
                          style={{ width: "60px", padding: "5px" }}
                          value={item.quantity}
                          onChange={(e) => {
                            const n = [...dispatchForm.items];
                            n[idx].quantity = e.target.value;
                            setDispatchForm({ ...dispatchForm, items: n });
                          }}
                        />
                        <button 
                          type="button" 
                          onClick={() => removeFromDispatch(item.menu_item_id)}
                          style={{ background: 'none', border: 'none', color: '#be123c', cursor: 'pointer', padding: '5px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowDispatchModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: "#0369a1" }}
                >
                  Confirm Dispatch to Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Return Modal */}
      {showReturnModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "800px" }}>
            <div className="modal-header">
              <h3>
                <RotateCcw
                  size={22}
                  style={{ color: "#be123c", marginRight: "10px" }}
                />{" "}
                Process Sales Return (Wastage)
              </h3>
              <button
                className="btn-close"
                onClick={() => setShowReturnModal(false)}
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleReturnSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div className="form-group">
                      <label><Building2 size={14} /> Source Client / Partner</label>
                      <SearchableSelect
                        options={vendors.map(v => ({ value: v.vendor_id, label: v.name_en }))}
                        value={returnForm.vendor_id}
                        onChange={(val) => {
                          setReturnForm({...returnForm, vendor_id: String(val), sale_id: "", items: []});
                        }}
                        placeholder="Choose Partner..."
                      />
                    </div>
                    <div className="form-group">
                      <label><ArrowRight size={14} /> Source Branch</label>
                      <SearchableSelect
                        options={[
                          { value: 'main', label: 'Main Office' },
                          ...((vendors.find(v => String(v.vendor_id) === String(returnForm.vendor_id)) as any)?.branches?.map((br: any) => ({
                            value: br.branch_id,
                            label: br.name_en
                          })) || [])
                        ]}
                        value={returnForm.branch_id}
                        onChange={(val) => {
                          setReturnForm({...returnForm, branch_id: String(val), sale_id: "", items: []});
                        }}
                        placeholder="Choose Branch..."
                      />
                    </div>
                    <div className="form-group">
                      <label><ClipboardList size={14} /> Select Dispatch Order</label>
                      <SearchableSelect
                        options={vendorDispatches.map(d => ({
                          value: d.sale_id,
                          label: `Order: ${d.order_number} | Batch: ${d.batch_number || 'N/A'} (${new Date(d.created_at).toLocaleDateString()})`
                        }))}
                        value={returnForm.sale_id}
                        onChange={(val) => handleReturnSaleSelect(String(val))}
                        placeholder="Choose Dispatch Order..."
                      />
                    </div>
                    <div className="form-group">
                       <label>Reason for Return</label>
                       <input 
                         type="text" 
                         value={returnForm.reason}
                         onChange={(e) => setReturnForm({...returnForm, reason: e.target.value})}
                       />
                    </div>
                </div>

                <div 
                  style={{ 
                    background: "white", 
                    border: "1px solid #f1f5f9", 
                    padding: "20px", 
                    borderRadius: "15px",
                    minHeight: '200px'
                  }}
                >
                  <h4 style={{ fontSize: "14px", marginBottom: "20px", color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    ITEMS DELIVERED IN THIS DISPATCH
                  </h4>
                  
                  {returnForm.items.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                       {returnForm.vendor_id ? "Please select a Dispatch Order to see items." : "Select a Client first."}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {returnForm.items.map((item, idx) => (
                        <div key={idx} style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: 'space-between',
                          padding: '12px',
                          background: '#f8fafc',
                          borderRadius: '12px'
                        }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '13px' }}>{item.name_en}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Original Qty: {item.original_quantity}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 600 }}>RETURNED:</label>
                            <input
                              type="number"
                              style={{ width: "80px", padding: "8px", borderRadius: '8px', border: '1px solid #e2e8f0' }}
                              value={item.quantity}
                              onChange={(e) => {
                                const n = [...returnForm.items];
                                n[idx].quantity = e.target.value;
                                setReturnForm({ ...returnForm, items: n });
                              }}
                            />
                            <button 
                              type="button" 
                              onClick={() => removeFromReturn(item.menu_item_id)}
                              style={{ background: 'none', border: 'none', color: '#be123c', cursor: 'pointer', padding: '5px' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                 <button type="button" className="btn-secondary" onClick={() => setShowReturnModal(false)}>Cancel</button>
                 <button type="submit" className="btn-primary" style={{ background: "#be123c" }}>Record Return & Trash Items</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Print Container */}
      <div style={{ display: 'none' }}>
          <FullInvoicePrint 
            ref={printRef} 
            order={printReturnData?.order || {}} 
            items={printReturnData?.items || []} 
            isReturn={true}
          />
      </div>

    </Layout>
  );
};

export default FactoryDispatchPage;
