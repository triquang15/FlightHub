# 🧪 API Rate Limit Test (Quick Guide)

## 1. Setup

```bash
TOKEN="your_access_token_here"
```

---

## 2. Test Script

```bash
for i in $(seq 1 10); do
  echo "------ Request $i ------"
  curl -s -w "\nStatus: %{http_code}\n\n" \
    http://localhost:8080/api/users/profile \
    -H "Authorization: Bearer $TOKEN"
done
```

---

## 3. Expected Result

### ✅ Normal

```json
{ "status": 200, "message": "SUCCESS" }
Status: 200
```

### 🔥 Rate Limited

```json
{
  "status": 429,
  "errorCode": "SEC_003",
  "message": "Too many requests"
}
Status: 429
```

---

## 4. Notes

* This script shows **body + status**
* ❌ Does NOT show headers

---

## 5. Full Debug (recommended)

```bash
curl -i http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

✔ Shows headers + body
✔ Use for debugging rate limit

---

## 🏁 Summary

* `curl -s` → body
* `curl -s -w` → body + status
* `curl -i` → full response 🔥
