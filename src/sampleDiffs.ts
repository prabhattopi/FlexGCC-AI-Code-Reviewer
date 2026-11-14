export interface SampleDiff {
  id: string;
  name: string;
  language: string;
  description: string;
  diff: string;
}

export const SAMPLE_DIFFS: Record<string, SampleDiff> = {
  python: {
    id: "python",
    name: "Python: User Auth with SQL Injection & Missing Tests",
    language: "Python",
    description: "Contains raw SQL string interpolation, insecure MD5 password hashing, unhandled NoneType exception, and lacks unit tests.",
    diff: `diff --git a/services/auth_service.py b/services/auth_service.py
new file mode 100644
index 0000000..8a91c4b
--- /dev/null
+++ b/services/auth_service.py
@@ -0,0 +1,38 @@
+import hashlib
+import sqlite3
+from typing import Optional
+
+def get_db_connection():
+    return sqlite3.connect("users.db")
+
+def hash_password(password: str) -> str:
+    # CRITICAL: Using broken MD5 hash without salt
+    return hashlib.md5(password.encode()).hexdigest()
+
+def authenticate_user(username: str, password_raw: str) -> Optional[dict]:
+    print(f"Authenticating user: {username}")  # STYLE: Leftover print statement
+    hashed = hash_password(password_raw)
+    conn = get_db_connection()
+    cursor = conn.cursor()
+    
+    # CRITICAL BUG / SECURITY RISK: Direct SQL string interpolation (SQL Injection)
+    query = f"SELECT id, username, email, role FROM users WHERE username = '{username}' AND password_hash = '{hashed}'"
+    cursor.execute(query)
+    row = cursor.fetchone()
+    conn.close()
+    
+    # BUG: If row is None, row[3] raises TypeError: 'NoneType' object is not subscriptable
+    if row[3] == "admin":
+        is_admin = True
+    else:
+        is_admin = False
+        
+    return {
+        "id": row[0],
+        "username": row[1],
+        "email": row[2],
+        "is_admin": is_admin
+    }
`,
  },

  react: {
    id: "react",
    name: "React 19: Dashboard Widget with Memory Leak & XSS",
    language: "TypeScript / React",
    description: "Contains missing clearInterval memory leak, unescaped dangerouslySetInnerHTML XSS flaw, and console.log leftovers.",
    diff: `diff --git a/src/components/MetricWidget.tsx b/src/components/MetricWidget.tsx
new file mode 100644
index 0000000..f3b8901
--- /dev/null
+++ b/src/components/MetricWidget.tsx
@@ -0,0 +1,42 @@
+import React, { useState, useEffect } from 'react';
+
+interface MetricWidgetProps {
+  endpointUrl: string;
+  rawHtmlDisclaimer?: string;
+}
+
+export function MetricWidget({ endpointUrl, rawHtmlDisclaimer }: MetricWidgetProps) {
+  const [metrics, setMetrics] = useState<any>(null);
+  const [error, setError] = useState<string | null>(null);
+
+  useEffect(() => {
+    // BUG: setInterval without cleanup function creates unbounded memory leak on unmount
+    const intervalId = setInterval(async () => {
+      try {
+        const res = await fetch(endpointUrl);
+        const data = await res.json();
+        console.log("Fetched live metrics:", data); // STYLE: Debug log in production
+        setMetrics(data);
+      } catch (err: any) {
+        setError(err.message);
+      }
+    }, 3000);
+  }, [endpointUrl]);
+
+  return (
+    <div className="p-4 border rounded shadow">
+      <h3 className="font-bold text-lg">System Metrics</h3>
+      {error && <div className="text-red-500">Error: {error}</div>}
+      {metrics && <div>CPU Usage: {metrics.cpu}%</div>}
+      
+      {/* SECURITY RISK: XSS vulnerability through unsanitized dangerouslySetInnerHTML */}
+      {rawHtmlDisclaimer && (
+        <div 
+          className="text-xs text-gray-500 mt-2"
+          dangerouslySetInnerHTML={{ __html: rawHtmlDisclaimer }} 
+        />
+      )}
+    </div>
+  );
+}
`,
  },

  dotnet: {
    id: "dotnet",
    name: "C# / .NET: Payment Processor with Async Void & Null Bug",
    language: "C#",
    description: "Contains async void exception swallow, unhandled null reference on customer lookup, and unindexed LINQ query.",
    diff: `diff --git a/Services/PaymentProcessor.cs b/Services/PaymentProcessor.cs
new file mode 100644
index 0000000..b2a1934
--- /dev/null
+++ b/Services/PaymentProcessor.cs
@@ -0,0 +1,45 @@
+using System;
+using System.Threading.Tasks;
+using Microsoft.Extensions.Logging;
+
+namespace FlexGcc.Services
+{
+    public class PaymentProcessor
+    {
+        private readonly ILogger<PaymentProcessor> _logger;
+        private readonly IPaymentGateway _gateway;
+        private readonly ICustomerRepository _customerRepo;
+
+        public PaymentProcessor(ILogger<PaymentProcessor> logger, IPaymentGateway gateway, ICustomerRepository customerRepo)
+        {
+            _logger = logger;
+            _gateway = gateway;
+            _customerRepo = customerRepo;
+        }
+
+        // BUG / RISK: Async void method cannot be awaited; unhandled exceptions crash process
+        public async void ProcessRecurringBilling(string customerId, decimal amount)
+        {
+            var customer = await _customerRepo.FindByIdAsync(customerId);
+            
+            // BUG: NullReferenceException if customer does not exist in database
+            string email = customer.BillingEmail.ToLower();
+            
+            if (amount = 0) // SYNTAX / LOGICAL BUG: Assignment '=' instead of comparison '=='
+            {
+                _logger.LogWarning("Zero amount detected");
+                return;
+            }
+
+            var result = await _gateway.ChargeAsync(customer.PaymentToken, amount);
+            if (!result.IsSuccess)
+            {
+                throw new PaymentFailedException(result.ErrorMessage);
+            }
+
+            _logger.LogInformation("Successfully billed {Email} for {Amount}", email, amount);
+        }
+    }
+}
`,
  },
};
