
import React, { useState, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Machine, MachineStatus } from '../types';

interface DashboardProps {
  machines: Machine[];
}

const Dashboard: React.FC<DashboardProps> = ({ machines }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalMachines = machines.length;
  const operationalCount = machines.filter(m => m.status === MachineStatus.OPERATIONAL).length;
  const maintenanceCount = machines.filter(m => m.status === MachineStatus.CRITICAL || m.status === MachineStatus.WARNING).length;
  const factoryHealth = totalMachines > 0 ? Math.round((operationalCount / totalMachines) * 100) : 0;

  const stats = [
    { label: 'ความพร้อมโรงงาน', value: `${factoryHealth}%`, color: 'blue', icon: '🏢' },
    { label: 'เปิดใช้งานอยู่', value: operationalCount, color: 'emerald', icon: '✅' },
    { label: 'ต้องได้รับการดูแล', value: maintenanceCount, color: 'rose', icon: '⚠️' },
    { label: 'ประสิทธิภาพ OEE', value: '88.4%', color: 'indigo', icon: '📈' },
  ];

  const efficiencyData = machines.map(m => ({
    name: m.name,
    efficiency: m.efficiency
  }));

  const COLORS = ['#3B82F6', '#EF4444'];

  return (
    <div className="space-y-10">
      
      {/* Balanced Header */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl">🏭</div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Thai Modern Case</h1>
            <p className="text-slate-400 text-sm font-medium">ระบบติดตามประสิทธิภาพและสุขภาพเครื่องจักรแบบเรียลไทม์</p>
          </div>
        </div>
        <div className="mt-6 md:mt-0 bg-slate-50 px-8 py-4 rounded-2xl border border-slate-100">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-1">Local Server Time</p>
           <p className="text-3xl font-black text-slate-800 font-mono tracking-tighter">
             {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
           </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-blue-200 transition-all">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110 ${
              stat.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
              stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
              stat.color === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
            }`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3">
             <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
             ประสิทธิภาพรายเครื่องจักร (Efficiency)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={efficiencyData}>
                <defs>
                  <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#cbd5e1" fontSize={10} fontWeight="bold" />
                <YAxis stroke="#cbd5e1" fontSize={10} fontWeight="bold" />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Area type="monotone" dataKey="efficiency" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorEff)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0F172A] p-8 rounded-[2.5rem] shadow-xl text-white">
          <h3 className="text-lg font-black mb-1">Health Distribution</h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-10">สัดส่วนสถานะเครื่องจักร</p>
          
          <div className="h-48 relative mb-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{name: 'ปกติ', value: operationalCount}, {name: 'ผิดปกติ', value: maintenanceCount}]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span className="text-3xl font-black">{factoryHealth}%</span>
               <span className="text-[8px] font-black text-blue-400 uppercase">Ready</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
               <span className="text-[10px] font-bold text-slate-400 uppercase">Optimal Status</span>
               <span className="font-bold">{operationalCount} เครื่อง</span>
            </div>
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
               <span className="text-[10px] font-bold text-slate-400 uppercase">Attention Needed</span>
               <span className="font-bold text-rose-400">{maintenanceCount} เครื่อง</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
