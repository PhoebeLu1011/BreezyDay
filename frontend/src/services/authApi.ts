export async function login(email: string, password: string) {
  const resp = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.message || "Login failed");
  }

  return resp.json();
}

export async function register(email: string, password: string) {
  const resp = await fetch("http://localhost:5000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.message || "Register failed");
  }

  return resp.json();
}
