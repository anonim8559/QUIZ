import pb from "./pocketbase";

export async function logoutUser(router) {
  const sessionId = localStorage.getItem("activeSessionId");
  const sessionStart = localStorage.getItem("sessionStart");

  if (sessionId && sessionStart) {
    try {
      const durationSeconds = Math.floor(
        (Date.now() - new Date(sessionStart).getTime()) / 1000
      );

      await pb.collection("sessions").update(sessionId, {
        end_time: new Date().toISOString(),
        duration: durationSeconds,
      });
    } catch (err) {
      console.error("Błąd przy zapisie end_time lub duration:", err);
    } finally {
      localStorage.removeItem("activeSessionId");
      localStorage.removeItem("sessionStart");
    }
  }

  pb.authStore.clear();
  router.push("/login");
}
