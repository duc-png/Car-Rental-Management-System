import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import FleetSidebar from '../components/owner/fleet/FleetSidebar';
import {
  getMaintenanceByVehicle,
  createMaintenanceRecord,
  updateMaintenanceStatus,
  addMaintenanceCostItem,
} from '../api/maintenance';
import { listOwnerVehicles } from '../api/ownerVehicles';
import '../styles/CarOwnerFleet.css';
import '../styles/MaintenanceDashboard.css';

const STATUS_OPTIONS = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const STATUS_LABELS = {
  SCHEDULED: 'Đã lên lịch',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const getStatusColor = (status) => {
  const colors = {
    SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return colors[status] || 'bg-slate-100 text-slate-700 border-slate-200';
};

const getStatusIcon = (status) => {
  const icons = {
    SCHEDULED: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    IN_PROGRESS: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    COMPLETED: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    CANCELLED: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };
  return icons[status] || null;
};

function MaintenanceDashboard() {
  const [searchParams] = useSearchParams();
  const vehicleId = Number(searchParams.get('vehicleId'));

  const { token, user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newRecord, setNewRecord] = useState({
    description: '',
    serviceType: '',
    odometerKm: '',
    scheduledAt: '',
  });

  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [updateStatusPayload, setUpdateStatusPayload] = useState({
    status: 'SCHEDULED',
    note: '',
  });

  const [newCostItem, setNewCostItem] = useState({
    category: '',
    description: '',
    quantity: 1,
    unitPrice: '',
  });

  const [activeTab, setActiveTab] = useState('create');
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [ownerVehicles, setOwnerVehicles] = useState([]);
  const [ownerVehiclesLoading, setOwnerVehiclesLoading] = useState(false);
  const [ownerVehiclesError, setOwnerVehiclesError] = useState('');

  const selectedRecord =
    selectedRecordId != null
      ? records.find((record) => record.id === selectedRecordId) || null
      : null;

  const stats = {
    total: records.length,
    scheduled: records.filter((r) => r.status === 'SCHEDULED').length,
    inProgress: records.filter((r) => r.status === 'IN_PROGRESS').length,
    completed: records.filter((r) => r.status === 'COMPLETED').length,
    totalCost: records.reduce((sum, r) => sum + Number(r.totalCost || 0), 0),
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!token) {
      navigate('/login');
      return;
    }

    const role = String(user?.role || '');
    const canAccessMaintenance =
      role.includes('ROLE_EXPERT') || role.includes('ROLE_CAR_OWNER');

    if (!canAccessMaintenance) {
      navigate('/');
      return;
    }

    if (!vehicleId) return;

    const load = async () => {
      try {
        setLoading(true);
        const list = await getMaintenanceByVehicle(vehicleId);
        setRecords(list || []);
      } catch (error) {
        toast.error(error.message || 'Không tải được lịch sử bảo dưỡng');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading, token, user?.role, vehicleId, navigate]);

  // Tải danh sách xe của chủ xe để cho phép chọn xe ngay trên màn Bảo dưỡng
  useEffect(() => {
    if (authLoading || !token) {
      return;
    }

    const role = String(user?.role || '');
    const canAccessMaintenance =
      role.includes('ROLE_EXPERT') || role.includes('ROLE_CAR_OWNER');

    if (!canAccessMaintenance) {
      return;
    }

    const ownerId = user?.userId || user?.id;
    if (!ownerId) {
      return;
    }

    let cancelled = false;

    const loadOwnerVehicles = async () => {
      try {
        setOwnerVehiclesLoading(true);
        setOwnerVehiclesError('');
        const data = await listOwnerVehicles(ownerId);
        if (!cancelled) {
          setOwnerVehicles(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelled) {
          setOwnerVehiclesError(error.message || 'Không thể tải danh sách xe của bạn');
        }
      } finally {
        if (!cancelled) {
          setOwnerVehiclesLoading(false);
        }
      }
    };

    loadOwnerVehicles();

    return () => {
      cancelled = true;
    };
  }, [authLoading, token, user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCreateRecord = async (event) => {
    event.preventDefault();
    try {
      if (newRecord.scheduledAt) {
        const picked = new Date(newRecord.scheduledAt);
        const now = new Date();
        if (Number.isNaN(picked.getTime())) {
          toast.error('Thời gian bảo dưỡng không hợp lệ');
          return;
        }
        // không bắt buộc phải tương lai, nhưng tránh chọn quá xa trong quá khứ do nhập sai
        if (picked.getFullYear() < 2000) {
          toast.error('Thời gian bảo dưỡng quá xa trong quá khứ, vui lòng kiểm tra lại');
          return;
        }
      }

      const payload = {
        vehicleId,
        description: newRecord.description || undefined,
        serviceType: newRecord.serviceType || undefined,
        odometerKm: newRecord.odometerKm ? Number(newRecord.odometerKm) : undefined,
        scheduledAt: newRecord.scheduledAt || undefined,
      };
      const created = await createMaintenanceRecord(payload);
      setRecords((prev) => [created, ...prev]);
      setNewRecord({
        description: '',
        serviceType: '',
        odometerKm: '',
        scheduledAt: '',
      });
      setActiveTab('status');
      setSelectedRecordId(created.id);
      toast.success('✅ Tạo hồ sơ bảo dưỡng thành công');
    } catch (error) {
      const errorMsg = error.message || 'Không thể tạo hồ sơ bảo dưỡng';
      
      if (errorMsg.includes('already has active maintenance')) {
        toast.error('⚠️ Xe đang có lịch bảo dưỡng chưa hoàn thành');
      } else if (errorMsg.includes('not available')) {
        toast.error('⚠️ Xe không sẵn sàng để bảo dưỡng');
      } else if (errorMsg.includes('do not own')) {
        toast.error('🔒 Bạn không có quyền tạo bảo dưỡng cho xe này');
      } else {
        toast.error(errorMsg);
      }
    }
  };

  const handleUpdateStatus = async (event) => {
    event.preventDefault();
    if (!selectedRecordId) {
      toast.error('Chọn một hồ sơ bảo dưỡng');
      return;
    }
    try {
      const updated = await updateMaintenanceStatus(selectedRecordId, {
        status: updateStatusPayload.status,
        note: updateStatusPayload.note || undefined,
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success('✅ Cập nhật trạng thái thành công');
    } catch (error) {
      const errorMsg = error.message || 'Không thể cập nhật trạng thái';
      
      if (errorMsg.includes('Invalid maintenance status transition')) {
        toast.error('⚠️ Chuyển trạng thái không hợp lệ');
      } else if (errorMsg.includes('Cannot modify completed')) {
        toast.error('⚠️ Không thể sửa hồ sơ đã hoàn thành/hủy');
      } else if (errorMsg.includes('do not own')) {
        toast.error('🔒 Bạn không có quyền sửa xe này');
      } else {
        toast.error(errorMsg);
      }
    }
  };

  const handleAddCostItem = async (event) => {
    event.preventDefault();
    if (!selectedRecordId) {
      toast.error('Chọn một hồ sơ bảo dưỡng');
      return;
    }
    try {
      const payload = {
        category: newCostItem.category,
        description: newCostItem.description || undefined,
        quantity: newCostItem.quantity ? Number(newCostItem.quantity) : 1,
        unitPrice: newCostItem.unitPrice ? Number(newCostItem.unitPrice) : 0,
      };
      const updated = await addMaintenanceCostItem(selectedRecordId, payload);
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setNewCostItem({
        category: '',
        description: '',
        quantity: 1,
        unitPrice: '',
      });
      toast.success('✅ Thêm chi phí thành công');
    } catch (error) {
      const errorMsg = error.message || 'Không thể thêm chi phí';
      
      if (errorMsg.includes('Cannot modify completed')) {
        toast.error('⚠️ Không thể thêm chi phí cho hồ sơ đã hoàn thành/hủy');
      } else if (errorMsg.includes('do not own')) {
        toast.error('🔒 Bạn không có quyền sửa xe này');
      } else {
        toast.error(errorMsg);
      }
    }
  };

  return (
    <div className="fleet-dashboard">
      <FleetSidebar user={user} onLogout={handleLogout} />

      <section className="fleet-main">
        <header className="fleet-header">
          <div>
            <p className="fleet-breadcrumb">Car Owner / Maintenance</p>
            <h1>Maintenance Management</h1>
            <p>Theo dõi bảo dưỡng và chi phí cho xe #{vehicleId}</p>
          </div>
        </header>

        {!vehicleId && (
          <div className="maintenance-empty-notice">
            <svg className="w-20 h-20 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Chưa chọn xe</h3>
            <p className="text-sm text-slate-500 mb-4">
              Chọn một xe bên dưới để xem và quản lý hồ sơ bảo dưỡng.
            </p>

            {ownerVehiclesError && (
              <p className="text-sm text-red-600 mb-2">{ownerVehiclesError}</p>
            )}

            {ownerVehiclesLoading ? (
              <p className="text-sm text-slate-500 mb-2">Đang tải danh sách xe của bạn...</p>
            ) : ownerVehicles.length === 0 ? (
              <p className="text-sm text-slate-500 mb-2">
                Bạn chưa có xe nào. Vào trang Quản lý xe để thêm xe mới.
              </p>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <select
                  className="form-select min-w-[260px]"
                  defaultValue=""
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (!selectedId) return;
                    navigate(`/owner/maintenance?vehicleId=${selectedId}`);
                  }}
                >
                  <option value="">-- Chọn xe để xem bảo dưỡng --</option>
                  {ownerVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      #{v.id} - {v.modelName || v.carModelName || 'Xe'} ({v.licensePlate || 'chưa có biển số'})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400">
                  Hoặc vào trang Quản lý xe để xem chi tiết từng xe.
                </p>
              </div>
            )}

            <button
              onClick={() => navigate('/owner/fleet')}
              className="mt-6 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Quay lại Fleet
            </button>
          </div>
        )}

        {vehicleId && (
          <div className="maintenance-content">
            {/* Stats Grid */}
            <section className="maintenance-stats-row">
              <div className="stat-card stat-card-primary">
                <div className="stat-icon bg-blue-100 text-blue-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="stat-content">
                  <p className="stat-label">Tổng hồ sơ</p>
                  <h3 className="stat-value">{stats.total}</h3>
                  <p className="stat-sublabel">Lịch sử bảo dưỡng</p>
                </div>
              </div>

              <div className="stat-card stat-card-warning">
                <div className="stat-icon bg-amber-100 text-amber-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="stat-content">
                  <p className="stat-label">Đang xử lý</p>
                  <h3 className="stat-value">{stats.scheduled + stats.inProgress}</h3>
                  <p className="stat-sublabel">{stats.scheduled} lên lịch, {stats.inProgress} đang làm</p>
                </div>
              </div>

              <div className="stat-card stat-card-success">
                <div className="stat-icon bg-emerald-100 text-emerald-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="stat-content">
                  <p className="stat-label">Hoàn thành</p>
                  <h3 className="stat-value">{stats.completed}</h3>
                  <p className="stat-sublabel">Đã bảo dưỡng xong</p>
                </div>
              </div>

              <div className="stat-card stat-card-cost">
                <div className="stat-icon bg-violet-100 text-violet-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="stat-content">
                  <p className="stat-label">Tổng chi phí</p>
                  <h3 className="stat-value stat-value-large">{stats.totalCost.toLocaleString('vi-VN')}</h3>
                  <p className="stat-sublabel">VNĐ</p>
                </div>
              </div>
            </section>

            {/* Action Tabs */}
            <section className="maintenance-tabs-section">
              <div className="maintenance-tabs">
                <button
                  type="button"
                  className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
                  onClick={() => setActiveTab('create')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tạo hồ sơ mới
                </button>
                <button
                  type="button"
                  className={`tab-button ${activeTab === 'status' ? 'active' : ''}`}
                  onClick={() => setActiveTab('status')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Cập nhật trạng thái
                </button>
                <button
                  type="button"
                  className={`tab-button ${activeTab === 'cost' ? 'active' : ''}`}
                  onClick={() => setActiveTab('cost')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Thêm chi phí
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'create' && (
                  <form onSubmit={handleCreateRecord} className="maintenance-form">
                    <div className="form-header">
                      <h2>Tạo hồ sơ bảo dưỡng mới</h2>
                      <p>Nhập thông tin lần bảo dưỡng tiếp theo cho xe</p>
                    </div>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label>Loại dịch vụ</label>
                        <input
                          type="text"
                          placeholder="VD: Thay dầu, Bảo dưỡng định kỳ, Kiểm tra hệ thống..."
                          value={newRecord.serviceType}
                          onChange={(e) =>
                            setNewRecord((prev) => ({ ...prev, serviceType: e.target.value }))
                          }
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Số km hiện tại</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={newRecord.odometerKm}
                          onChange={(e) =>
                            setNewRecord((prev) => ({ ...prev, odometerKm: e.target.value }))
                          }
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Thời gian dự kiến</label>
                        <input
                          type="datetime-local"
                          value={newRecord.scheduledAt}
                          onChange={(e) =>
                            setNewRecord((prev) => ({ ...prev, scheduledAt: e.target.value }))
                          }
                          className="form-input"
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Mô tả chi tiết (tùy chọn)</label>
                        <textarea
                          placeholder="Ghi chú thêm về lần bảo dưỡng này..."
                          value={newRecord.description}
                          onChange={(e) =>
                            setNewRecord((prev) => ({ ...prev, description: e.target.value }))
                          }
                          className="form-textarea"
                          rows={3}
                        />
                      </div>
                    </div>
                    <button type="submit" className="form-submit-btn">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Tạo hồ sơ bảo dưỡng
                    </button>
                  </form>
                )}

                {activeTab === 'status' && (
                  <form onSubmit={handleUpdateStatus} className="maintenance-form">
                    <div className="form-header">
                      <h2>Cập nhật trạng thái bảo dưỡng</h2>
                      <p>Chọn hồ sơ và trạng thái mới</p>
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Chọn hồ sơ bảo dưỡng</label>
                        <select
                          value={selectedRecordId || ''}
                          onChange={(e) =>
                            setSelectedRecordId(e.target.value ? Number(e.target.value) : null)
                          }
                          className="form-select"
                        >
                          <option value="">-- Chọn hồ sơ --</option>
                          {records.map((r) => (
                            <option key={r.id} value={r.id}>
                              #{r.id} - {r.serviceType || 'Bảo dưỡng'} ({STATUS_LABELS[r.status]})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Trạng thái mới</label>
                        <select
                          value={updateStatusPayload.status}
                          onChange={(e) =>
                            setUpdateStatusPayload((prev) => ({ ...prev, status: e.target.value }))
                          }
                          className="form-select"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group full-width">
                        <label>Ghi chú (tùy chọn)</label>
                        <input
                          type="text"
                          placeholder="Thêm ghi chú về thay đổi trạng thái..."
                          value={updateStatusPayload.note}
                          onChange={(e) =>
                            setUpdateStatusPayload((prev) => ({ ...prev, note: e.target.value }))
                          }
                          className="form-input"
                        />
                      </div>
                    </div>
                    <button type="submit" className="form-submit-btn" disabled={!selectedRecordId}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Cập nhật trạng thái
                    </button>
                  </form>
                )}

                {activeTab === 'cost' && (
                  <form onSubmit={handleAddCostItem} className="maintenance-form">
                    <div className="form-header">
                      <h2>Thêm chi phí bảo dưỡng</h2>
                      <p>
                        Ghi nhận chi tiết chi phí cho hồ sơ{' '}
                        {selectedRecordId ? (
                          <span className="font-semibold text-slate-900">#{selectedRecordId}</span>
                        ) : (
                          <span className="text-amber-600">chưa chọn</span>
                        )}
                      </p>
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Loại chi phí</label>
                        <input
                          type="text"
                          placeholder="VD: Labor, Parts, Materials..."
                          value={newCostItem.category}
                          onChange={(e) =>
                            setNewCostItem((prev) => ({ ...prev, category: e.target.value }))
                          }
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Số lượng</label>
                        <input
                          type="number"
                          placeholder="1"
                          min="1"
                          value={newCostItem.quantity}
                          onChange={(e) =>
                            setNewCostItem((prev) => ({ ...prev, quantity: e.target.value }))
                          }
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Đơn giá (VNĐ)</label>
                        <input
                          type="number"
                          placeholder="0"
                          min="0"
                          value={newCostItem.unitPrice}
                          onChange={(e) =>
                            setNewCostItem((prev) => ({ ...prev, unitPrice: e.target.value }))
                          }
                          className="form-input"
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Mô tả chi phí (tùy chọn)</label>
                        <textarea
                          placeholder="Mô tả chi tiết về khoản chi phí này..."
                          value={newCostItem.description}
                          onChange={(e) =>
                            setNewCostItem((prev) => ({ ...prev, description: e.target.value }))
                          }
                          className="form-textarea"
                          rows={2}
                        />
                      </div>
                    </div>
                    {newCostItem.unitPrice && newCostItem.quantity && (
                      <div className="cost-preview">
                        <span>Tổng cộng:</span>
                        <span className="cost-total">
                          {(Number(newCostItem.unitPrice) * Number(newCostItem.quantity)).toLocaleString('vi-VN')} VNĐ
                        </span>
                      </div>
                    )}
                    <button type="submit" className="form-submit-btn" disabled={!selectedRecordId}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Thêm chi phí
                    </button>
                  </form>
                )}
              </div>
            </section>

            {/* Records List & Detail */}
            <section className="maintenance-records-section">
              <div className="records-list-panel">
                <div className="panel-header">
                  <div>
                    <h2>Lịch sử bảo dưỡng</h2>
                    <p>Chọn một hồ sơ để xem chi tiết</p>
                  </div>
                  {records.length > 0 && (
                    <span className="records-count-badge">
                      {records.length} hồ sơ
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="records-loading">
                    <div className="loading-spinner"></div>
                    <p>Đang tải hồ sơ bảo dưỡng...</p>
                  </div>
                ) : records.length === 0 ? (
                  <div className="records-empty">
                    <svg className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="empty-title">Chưa có hồ sơ bảo dưỡng</p>
                    <p className="empty-subtitle">Tạo hồ sơ mới để bắt đầu theo dõi</p>
                  </div>
                ) : (
                  <div className="records-list">
                    {records.map((r) => (
                      <article
                        key={r.id}
                        className={`record-card ${selectedRecordId === r.id ? 'selected' : ''}`}
                        onClick={() => setSelectedRecordId(r.id)}
                      >
                        <div className="record-header">
                          <div className="record-title-group">
                            <p className="record-id">Hồ sơ #{r.id}</p>
                            <h3 className="record-title">{r.serviceType || 'Bảo dưỡng định kỳ'}</h3>
                          </div>
                          <span className={`record-status-badge ${getStatusColor(r.status)}`}>
                            {getStatusIcon(r.status)}
                            {STATUS_LABELS[r.status]}
                          </span>
                        </div>
                        <div className="record-body">
                          <div className="record-meta">
                            <div className="meta-item">
                              <svg className="meta-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>
                                {r.scheduledAt
                                  ? new Date(r.scheduledAt).toLocaleDateString('vi-VN')
                                  : 'Chưa có lịch'}
                              </span>
                            </div>
                            {r.odometerKm && (
                              <div className="meta-item">
                                <svg className="meta-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>{r.odometerKm.toLocaleString('vi-VN')} km</span>
                              </div>
                            )}
                          </div>
                          <div className="record-cost">
                            <span className="cost-label">Chi phí:</span>
                            <span className="cost-value">
                              {Number(r.totalCost || 0).toLocaleString('vi-VN')} VNĐ
                            </span>
                          </div>
                          {r.description && (
                            <p className="record-description">{r.description}</p>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="record-detail-panel">
                <div className="panel-header">
                  <h2>Chi tiết hồ sơ</h2>
                  <p>Thông tin đầy đủ về lần bảo dưỡng</p>
                </div>

                {!selectedRecord ? (
                  <div className="detail-empty">
                    <svg className="empty-icon-small" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="empty-title-small">Chưa chọn hồ sơ</p>
                    <p className="empty-subtitle-small">Chọn hồ sơ bên trái để xem chi tiết</p>
                  </div>
                ) : (
                  <div className="detail-content">
                    <div className="detail-header">
                      <div>
                        <p className="detail-id">Hồ sơ #{selectedRecord.id}</p>
                        <h3 className="detail-title">{selectedRecord.serviceType || 'Bảo dưỡng định kỳ'}</h3>
                      </div>
                      <span className={`detail-status-badge ${getStatusColor(selectedRecord.status)}`}>
                        {getStatusIcon(selectedRecord.status)}
                        {STATUS_LABELS[selectedRecord.status]}
                      </span>
                    </div>

                    <dl className="detail-info-grid">
                      <div className="info-item">
                        <dt>Thời gian dự kiến</dt>
                        <dd>
                          {selectedRecord.scheduledAt
                            ? new Date(selectedRecord.scheduledAt).toLocaleString('vi-VN')
                            : '—'}
                        </dd>
                      </div>
                      <div className="info-item">
                        <dt>Ngày tạo</dt>
                        <dd>
                          {selectedRecord.createdAt
                            ? new Date(selectedRecord.createdAt).toLocaleString('vi-VN')
                            : '—'}
                        </dd>
                      </div>
                      <div className="info-item">
                        <dt>Số km</dt>
                        <dd>
                          {selectedRecord.odometerKm
                            ? `${selectedRecord.odometerKm.toLocaleString('vi-VN')} km`
                            : '—'}
                        </dd>
                      </div>
                      <div className="info-item">
                        <dt>Tổng chi phí</dt>
                        <dd className="cost-highlight">
                          {Number(selectedRecord.totalCost || 0).toLocaleString('vi-VN')} VNĐ
                        </dd>
                      </div>
                    </dl>

                    {selectedRecord.description && (
                      <div className="detail-description-box">
                        <p className="box-label">Ghi chú bảo dưỡng</p>
                        <p className="box-content">{selectedRecord.description}</p>
                      </div>
                    )}

                    <div className="cost-items-section">
                      <div className="cost-items-header">
                        <p className="section-label">Chi tiết chi phí</p>
                        <p className="items-count">
                          {selectedRecord.costItems && selectedRecord.costItems.length > 0
                            ? `${selectedRecord.costItems.length} khoản`
                            : 'Chưa có'}
                        </p>
                      </div>

                      {selectedRecord.costItems && selectedRecord.costItems.length > 0 ? (
                        <div className="cost-items-list">
                          {selectedRecord.costItems.map((item) => (
                            <div key={item.id} className="cost-item">
                              <div className="cost-item-info">
                                <p className="cost-item-category">{item.category || 'Chi phí khác'}</p>
                                {item.description && (
                                  <p className="cost-item-description">{item.description}</p>
                                )}
                                <p className="cost-item-calc">
                                  {item.quantity} × {Number(item.unitPrice || 0).toLocaleString('vi-VN')} VNĐ
                                </p>
                              </div>
                              <p className="cost-item-total">
                                {Number(item.totalPrice || 0).toLocaleString('vi-VN')} VNĐ
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="cost-items-empty">
                          <p>Chưa có chi phí nào. Sử dụng tab &quot;Thêm chi phí&quot; để bắt đầu.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

export default MaintenanceDashboard;

