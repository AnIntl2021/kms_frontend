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
  Users,
  Eye,
  Pencil,
} from "lucide-react";
import "./InventoryPage.css";
import { toast } from "react-toastify";
import SearchableSelect from "../components/SearchableSelect";
import Swal from "sweetalert2";

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
  const [salesmen, setSalesmen] = useState<any[]>([]);
  const [productionLogs, setProductionLogs] = useState<any[]>([]);
  const [returnsHistory, setReturnsHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [showProduceModal, setShowProduceModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReturnViewModal, setShowReturnViewModal] = useState(false);
  const [showReturnEditModal, setShowReturnEditModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [editingReturnId, setEditingReturnId] = useState<number | null>(null);
  const [returnItems, setReturnItems] = useState<any[]>([]);

  const [produceForm, setProduceForm] = useState({
    production_date: new Date().toISOString().split("T")[0],
    expiry_date: "",
    items: [] as any[],
  });

  const [returnForm, setReturnForm] = useState({
    vendor_id: "",
    branch_id: "",
    sale_ids: [] as string[],
    reason: "Expired / Unsold",
    salesman_id: "",
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

  const handleReturnSaleSelect = async (saleIds: string[]) => {
    if (!saleIds || saleIds.length === 0) {
      setReturnForm({ ...returnForm, sale_ids: [], items: [] });
      return;
    }

    const toastId = toast.loading('Aggregating items from selected dispatches...');
    try {
      // 🚀 FETCH ALL SELECTED SALES IN PARALLEL
      const results = await Promise.all(
        saleIds.map(id => api.get(`/sales/${id}`))
      );

      // 📦 SAVE CURRENT USER INPUTS (QUANTITIES)
      const currentInputs = new Map();
      returnForm.items.forEach(item => {
        if (Number(item.quantity) > 0) {
          currentInputs.set(item.menu_item_id, item.quantity);
        }
      });

      // 📦 COLLECT ALL ITEMS FROM ALL BATCHES SEPARATELY
      let allItems: any[] = [];
      results.forEach(res => {
        if (res.data.success) {
          const saleData = res.data.data;
          const saleItems = saleData.items || [];
          saleItems.forEach((i: any) => {
             // UNIQUE KEY: ITEM ID + SALE ID
             const uniqueKey = `${i.menu_item_id}_${saleData.sale_id}`;
             
             allItems.push({
               ...i,
               unique_key: uniqueKey,
               sale_id: saleData.sale_id,
               order_number: saleData.order_number,
               original_quantity: i.quantity_delivered || i.quantity,
               // RESTORE QUANTITY IF USER HAD ALREADY TYPED SOMETHING FOR THIS SPECIFIC ITEM+BATCH
               quantity: currentInputs.get(uniqueKey) || 0
             });
          });
        }
      });

      setReturnForm({
        ...returnForm,
        sale_ids: saleIds,
        items: allItems
      });
      toast.dismiss(toastId);
    } catch (e) {
      toast.update(toastId, { render: "Failed to aggregate items.", type: 'error', isLoading: false, autoClose: 3000 });
    }
  };

  const [dispatchForm, setDispatchForm] = useState({
    vendor_id: "",
    batch_number: "",
    expiry_date: "",
    items: [] as any[],
    payment_method: "credit",
    discount_percentage: 0,
    salesman_id: "",
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
        api.get("/salesmen").catch(() => ({ data: { data: [] } })),
      ]);

      const vArr = results[0].data.data || results[0].data;
      const mArr = results[1].data.data || results[1].data;
      const dArr = results[2].data.data || results[2].data;
      const pArr = (results[3].data.data || results[3].data).filter(
        (p: any) => p.batch_number,
      );
      const rArr = results[4].data.data || results[4].data;
      const sArr = results[5].data.data || results[5].data;

      setVendors(Array.isArray(vArr) ? vArr : []);
      // 🛡️ ONLY SHOW FINISHED PRODUCTS (SELLING) IN DISTRIBUTION
      setMenuItems(Array.isArray(mArr) ? mArr.filter((i: any) => i.type === 'selling') : []);
      setDispatches(Array.isArray(dArr) ? dArr : []);
      setProductionLogs(Array.isArray(pArr) ? pArr : []);
      setReturnsHistory(Array.isArray(rArr) ? rArr : []);
      setSalesmen(Array.isArray(sArr) ? sArr : []);
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
    const result = await Swal.fire({
      title: "Delete Production Batch?",
      text: "This action cannot be undone and will NOT restore used stock automatically.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#be123c",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Delete Batch",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/factory/production/batch/${id}`);
      toast.success("Production batch deleted! 🗑️");
      fetchBaseData();
    } catch (e) {
      toast.error("Failed to delete production batch.");
    }
  };

  const handleDeleteDispatch = async (id: number) => {
    const result = await Swal.fire({
      title: "Delete Dispatch Order?",
      text: "Are you sure you want to permanently delete this distribution record?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#be123c",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Delete Order",
    });

    if (!result.isConfirmed) return;

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

  const removeFromReturn = (uniqueKey: string) => {
    setReturnForm({
      ...returnForm,
      items: returnForm.items.filter((i) => (i.unique_key || i.menu_item_id) !== uniqueKey),
    });
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnForm.vendor_id) return toast.warning("Please select a vendor.");
    if (returnForm.items.length === 0) return toast.warning("Please add items to the return list.");
    
    try {
      if (editingReturnId) {
        await api.put(`/factory/returns/${editingReturnId}`, {
          ...returnForm,
          items: returnForm.items.map(i => ({
            menu_item_id: i.menu_item_id,
            quantity: i.quantity,
            unit_price: i.price,
            expiry_date: i.expiry_date || null
          }))
        });
        toast.success("Return record updated successfully! ✨");
      } else {
        await api.post("/factory/returns", {
          ...returnForm,
          sale_id: returnForm.sale_ids[0],
          sale_ids: returnForm.sale_ids,
          items: returnForm.items.map(i => ({
            menu_item_id: i.menu_item_id,
            quantity: i.quantity,
            unit_price: i.price,
            expiry_date: i.expiry_date || null
          }))
        });
        toast.success("Returns Processed & Wastage Recorded! 🔄");
      }
      setShowReturnModal(false);
      setEditingReturnId(null);
      setReturnForm({ vendor_id: "", branch_id: "", sale_ids: [], salesman_id: "", reason: "Expired / Unsold", items: [] });
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
            width: "100%"
          }}
        >
          <div className="stock-table-card" style={{ width: "100%" }}>
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
                      <th>Salesman</th>
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
                             <div style={{ fontSize: '13px', fontWeight: 600 }}>{d.salesman_name || '---'}</div>
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
                             <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                               <button 
                                 onClick={async () => {
                                   setSelectedReturn(r);
                                   const toastId = toast.loading('Loading return details...');
                                   try {
                                     const res = await api.get(`/factory/returns/${r.return_id}/items`);
                                     setReturnItems(res.data.data || []);
                                     setShowReturnViewModal(true);
                                     toast.dismiss(toastId);
                                   } catch (e) {
                                     toast.update(toastId, { render: 'Failed to load details', type: 'error', isLoading: false, autoClose: 3000 });
                                   }
                                 }} 
                                 className="btn-icon" 
                                 style={{ padding: '6px', cursor: 'pointer', background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: '8px' }}
                                 title="View Details">
                                  <Eye size={16} />
                                </button>
                               <button 
                                 onClick={async () => {
                                   setSelectedReturn(r);
                                   setEditingReturnId(r.return_id);
                                   const toastId = toast.loading("Loading return details...");
                                   try {
                                     // 1. Fetch items already in this return
                                     const retRes = await api.get(`/factory/returns/${r.return_id}/items`);
                                     const currentReturnedItems = retRes.data.data;

                                     // 2. Fetch original dispatch items to allow "adding missed ones"
                                     const saleRes = await api.get(`/factory/sales/${r.sale_id}`);
                                     const originalDispatchItems = saleRes.data.data.items;

                                     // 3. Merge: If item exists in return, set its quantity. Else set quantity 0.
                                     const mergedItems = originalDispatchItems.map((orig: any) => {
                                        const returned = currentReturnedItems.find((ret: any) => ret.menu_item_id === orig.menu_item_id);
                                        return {
                                          ...orig,
                                          unique_key: `${orig.menu_item_id}_${r.sale_id}`,
                                          quantity: returned ? returned.quantity : 0,
                                          original_quantity: orig.quantity,
                                          price: orig.price
                                        };
                                     });

                                     setReturnForm({
                                       vendor_id: String(r.vendor_id),
                                       branch_id: String(r.branch_id),
                                       sale_ids: [String(r.sale_id)],
                                       reason: r.reason,
                                       salesman_id: String(r.salesman_id),
                                       items: mergedItems
                                     });
                                     
                                     setShowReturnModal(true);
                                     toast.dismiss(toastId);
                                   } catch (err) {
                                     toast.update(toastId, { render: "Failed to load edit data", type: 'error', isLoading: false, autoClose: 3000 });
                                   }
                                 }} 
                                 className="btn-icon" 
                                 style={{ padding: '6px', cursor: 'pointer', background: '#f0fdf4', color: '#10b981', border: 'none', borderRadius: '8px' }}
                                 title="Edit Return Info"
                               >
                                   <Pencil size={16} />
                               </button>
                               <button onClick={() => printReturn(r)} className="btn-icon" style={{ padding: '6px', cursor: 'pointer', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px' }} title="Print Receipt">
                                  <Printer size={16} />
                               </button>


                             </div>
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
              <div className="modal-body" style={{ padding: "1.25rem" }}>
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
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "2rem",
                    marginTop: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      flex: "1 1 350px",
                      minWidth: "280px",
                      background: "#f8fafc",
                      padding: "1.25rem",
                      borderRadius: "20px",
                      border: "1px solid #eef2f6",
                    }}
                  >
                    <h4 style={{ fontSize: "13px", marginBottom: "15px" }}>
                      Product Catalog
                    </h4>
                    <div style={{ maxHeight: "280px", overflowY: "auto", paddingRight: "5px" }}>
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
                      Current Batch Items
                    </h4>
                    <div style={{ maxHeight: "280px", overflowY: "auto", paddingRight: "5px" }}>
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
          <div className="modal-content" style={{ width: "95%", maxWidth: "1100px", borderRadius: "24px" }}>
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
              <div className="modal-body" style={{ padding: "1.25rem" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "1rem",
                    marginBottom: "15px",
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
                      onChange={(val) => {
                        const vendor = vendors.find(v => String(v.vendor_id) === String(val));
                        setDispatchForm({
                          ...dispatchForm,
                          vendor_id: String(val),
                          branch_id: "",
                          discount_percentage: vendor?.default_discount || 0
                        } as any);
                      }}
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
                      <Users size={14} /> Assigned Salesman
                    </label>
                    <SearchableSelect
                      options={salesmen.map((s) => ({
                        value: s.salesman_id,
                        label: s.name_en,
                      }))}
                      value={dispatchForm.salesman_id}
                      onChange={(val) =>
                        setDispatchForm({
                          ...dispatchForm,
                          salesman_id: String(val),
                        })
                      }
                      placeholder="Choose Salesman..."
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
                    display: "flex",
                    flexWrap: "nowrap",
                    gap: "1.5rem",
                    marginTop: "1rem",
                  }}
                >
                  <div
                    style={{
                      flex: "1 1 350px",
                      minWidth: "280px",
                      background: "#f8fafc",
                      padding: "1.25rem",
                      borderRadius: "20px",
                      border: "1px solid #eef2f6",
                    }}
                  >
                    <h4 style={{ fontSize: "13px", marginBottom: "15px" }}>
                      Finished Product Stock
                    </h4>
                    <div style={{ maxHeight: "280px", overflowY: "auto", paddingRight: "5px" }}>
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
                  </div>
                  <div
                    style={{
                      flex: "1 1 350px",
                      minWidth: "280px",
                      background: "white",
                      border: "1px solid #eef2f6",
                      padding: "1.25rem",
                      borderRadius: "20px",
                    }}
                  >
                    <h4 style={{ fontSize: "13px", marginBottom: "15px" }}>
                      Loading for Partner
                    </h4>
                    <div style={{ maxHeight: "280px", overflowY: "auto", paddingRight: "5px" }}>
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
          <div className="modal-content" style={{ width: "95%", maxWidth: "1100px", borderRadius: "24px" }}>
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
              <div className="modal-body" style={{ padding: "1.25rem" }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div className="form-group">
                      <label><Building2 size={14} /> Source Client / Partner</label>
                      <SearchableSelect
                        options={vendors.map(v => ({ value: v.vendor_id, label: v.name_en }))}
                        value={returnForm.vendor_id}
                        onChange={(val) => {
                          setReturnForm({...returnForm, vendor_id: String(val), sale_ids: [], items: []});
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
                          setReturnForm({...returnForm, branch_id: String(val), sale_ids: [], items: []});
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
                        value={returnForm.sale_ids}
                        isMulti={true}
                        closeMenuOnSelect={false}
                        onChange={(vals) => handleReturnSaleSelect(vals as string[])}
                        placeholder="Choose Dispatch Orders (Multiple)..."
                      />
                    </div>
                    <div className="form-group">
                       <label><Users size={14} /> Brought Back By (Salesman)</label>
                       <SearchableSelect
                         options={salesmen.map(s => ({ value: s.salesman_id, label: s.name_en }))}
                         value={returnForm.salesman_id}
                         onChange={(val) => setReturnForm({...returnForm, salesman_id: String(val)})}
                         placeholder="Choose Salesman..."
                       />
                    </div>
                    <div className="form-group">
                       <label>Reason for Return</label>
                       <input 
                         type="text" 
                         value={returnForm.reason}
                         onChange={(e) => setReturnForm({...returnForm, reason: e.target.value})}
                         placeholder="e.g. Expired / Unsold"
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
                       {returnForm.vendor_id ? "Please select Dispatch Order(s) to see items." : "Select a Client first."}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {returnForm.items.map((item, idx) => (
                        <div key={item.unique_key || idx} style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: 'space-between',
                          padding: '12px',
                          background: '#f8fafc',
                          borderRadius: '12px'
                        }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '13px' }}>{item.name_en}</div>
                            <div style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 700, background: 'rgba(1, 86, 44, 0.05)', display: 'inline-block', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>
                               Order: {item.order_number}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Original Qty: {item.original_quantity}</div>
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
                              onClick={() => removeFromReturn(item.unique_key || item.menu_item_id)}
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

      {/* VIEW RETURN MODAL */}
      {showReturnViewModal && selectedReturn && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: "95%", maxWidth: "800px", borderRadius: "24px" }}>
            <div className="modal-header">
              <h3><Eye size={22} style={{ color: "#3b82f6", marginRight: "10px" }} /> Return Details: #RET-{selectedReturn.return_id}</h3>
              <button className="btn-close" onClick={() => setShowReturnViewModal(false)}><X /></button>
            </div>
            <div className="modal-body" style={{ padding: "1.5rem" }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '15px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>CLIENT / PARTNER</div>
                  <div style={{ fontWeight: 700 }}>{selectedReturn.client_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>SALESMAN</div>
                  <div style={{ fontWeight: 700 }}>{selectedReturn.salesman_name || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>RETURN REASON</div>
                  <div style={{ fontWeight: 700, color: '#be123c' }}>{selectedReturn.reason}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>RETURN DATE</div>
                  <div style={{ fontWeight: 700 }}>{new Date(selectedReturn.created_at).toLocaleString()}</div>
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: '15px', border: '1px solid #f1f5f9' }}>
                <h4 style={{ padding: '15px', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>Returned Items</h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px' }}>
                   {returnItems.map((item, idx) => {
                     const pName = item.product_name || item.name_en || item.name || 'Unknown Product';
                     const uPrice = Number(item.unit_price || item.price || 0);
                     const qty = Number(item.quantity || 0);
                     return (
                       <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '10px', marginBottom: '8px' }}>
                         <div>
                           <div style={{ fontWeight: 700, fontSize: '13px' }}>{pName}</div>
                           <div style={{ fontSize: '11px', color: '#64748b' }}>Unit Price: {uPrice.toFixed(3)} KWD</div>
                         </div>
                         <div style={{ textAlign: 'right' }}>
                           <div style={{ fontWeight: 800, color: '#be123c' }}>Qty: {qty}</div>
                           <div style={{ fontSize: '11px', fontWeight: 700 }}>Total: {(qty * uPrice).toFixed(3)} KWD</div>
                         </div>
                       </div>
                     );
                   })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowReturnViewModal(false)}>Close View</button>
              <button className="btn-primary" onClick={() => { setShowReturnViewModal(false); printReturn(selectedReturn); }}>
                <Printer size={16} style={{ marginRight: '8px' }} /> Print Receipt
              </button>
            </div>
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
