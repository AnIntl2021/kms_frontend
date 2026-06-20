const fs = require('fs');
let code = fs.readFileSync('.\\src\\pages\\DispatchDashboardPage.tsx', 'utf-8');
code = code.replace(/dispatch_status: 'pending' \| 'in_transit' \| 'dispatched' \| 'delivered' \| 'returned';/g, "dispatch_status: 'pending' | 'processing' | 'completed' | 'cancelled';\n  order_type?: string;");
code = code.replace(/'delivered'/g, "'completed'");
code = code.replace(/'in_transit'/g, "'processing'");
code = code.replace(/\|\| d\.dispatch_status === 'dispatched'/g, "");
code = code.replace(/\|\| selectedDispatch\.dispatch_status === 'dispatched'/g, "");
code = code.replace(/'dispatched'/g, "'processing'");
fs.writeFileSync('.\\src\\pages\\DispatchDashboardPage.tsx', code);
