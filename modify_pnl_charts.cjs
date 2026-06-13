const fs = require('fs');

let content = fs.readFileSync('c:/xampp/htdocs/fresh_n_fast_frontend/src/pages/StorePNLReportPage.tsx', 'utf-8');

if (!content.includes('import { PieChart')) {
  content = content.replace("import { toast } from 'react-toastify';", "import { toast } from 'react-toastify';\nimport { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadialBarChart, RadialBar, Legend } from 'recharts';");
}

const chartsInjection = `

            {/* 📊 NEXT-GEN CHARTS GRID */}
            <div className="analytics-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
              
              {/* REVENUE BREAKDOWN */}
              <div className="analytics-chart-card glass-glow-blue" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.5px' }}>REVENUE BREAKDOWN</h3>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.salesByCategory}
                        dataKey="sales"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                      >
                        {data.salesByCategory.map((entry, index) => (
                          <Cell key={\`cell-\${index}\`} fill={['#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => \`\${Number(val).toFixed(3)} د.ك\`} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* EXPENSE DISTRIBUTION */}
              <div className="analytics-chart-card glass-glow-rose" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.5px' }}>EXPENSE DISTRIBUTION</h3>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'COGS (Recipes)', value: data.totalCogs },
                          ...data.laborExpenses.map(l => ({ name: l.category + ' (Labor)', value: l.amount })),
                          ...data.otherExpenses.map(o => ({ name: o.category, value: o.amount }))
                        ].filter(item => item.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                      >
                        {Array(20).fill(0).map((_, index) => (
                          <Cell key={\`cell-\${index}\`} fill={['#f43f5e', '#e11d48', '#be123c', '#fb923c', '#f59e0b', '#d97706', '#94a3b8', '#64748b'][index % 8]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => \`\${Number(val).toFixed(3)} د.ك\`} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* PROFIT MARGIN GAUGE */}
              <div className="analytics-chart-card glass-glow-green" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.5px' }}>NET MARGIN GAUGE</h3>
                <div style={{ flex: 1, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      cx="50%" 
                      cy="100%" 
                      innerRadius="100%" 
                      outerRadius="140%" 
                      barSize={15} 
                      data={[{ name: 'Margin', value: data.totalSales > 0 ? (data.netIncome / data.totalSales * 100) : 0, fill: data.netIncome >= 0 ? '#10b981' : '#ef4444' }]} 
                      startAngle={180} 
                      endAngle={0}
                    >
                      <RadialBar minAngle={15} background clockWise={true} dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: data.netIncome >= 0 ? '#16a34a' : '#dc2626' }}>
                      {data.totalSales > 0 ? ((data.netIncome / data.totalSales) * 100).toFixed(1) : 0}%
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>PROFIT MARGIN</div>
                  </div>
                </div>
              </div>

            </div>
`;

if (!content.includes('NEXT-GEN CHARTS GRID')) {
  content = content.replace("            {/* Grid Layout for details */}", chartsInjection + "\n            {/* Grid Layout for details */}");
}

fs.writeFileSync('c:/xampp/htdocs/fresh_n_fast_frontend/src/pages/StorePNLReportPage.tsx', content);
console.log("Injected charts into StorePNLReportPage.tsx");
