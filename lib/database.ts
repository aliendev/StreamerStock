interface GameEvent {
  id: string
  type: "trade" | "travel" | "upgrade" | "event" | "auth"
  timestamp: number
  playerId: string
  data: any
}

interface PlayerData {
  id: string
  twitchId: string
  username: string
  cash: number
  channelPoints: number
  health: number
  capacity: number
  location: string
  day: number
  debt: number
  inventory: Record<string, number>
  upgrades: string[]
  createdAt: number
  lastPlayed: number
}

interface GameSession {
  id: string
  playerId: string
  startTime: number
  endTime?: number
  events: GameEvent[]
  finalScore?: number
}

class GameDatabase {
  private db: IDBDatabase | null = null
  private dbName = "StreamerStockDB"
  private version = 1

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Players store
        if (!db.objectStoreNames.contains("players")) {
          const playersStore = db.createObjectStore("players", { keyPath: "id" })
          playersStore.createIndex("twitchId", "twitchId", { unique: true })
        }

        // Game sessions store
        if (!db.objectStoreNames.contains("sessions")) {
          const sessionsStore = db.createObjectStore("sessions", { keyPath: "id" })
          sessionsStore.createIndex("playerId", "playerId", { unique: false })
        }

        // Events store
        if (!db.objectStoreNames.contains("events")) {
          const eventsStore = db.createObjectStore("events", { keyPath: "id" })
          eventsStore.createIndex("playerId", "playerId", { unique: false })
          eventsStore.createIndex("type", "type", { unique: false })
          eventsStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        // Leaderboard store
        if (!db.objectStoreNames.contains("leaderboard")) {
          db.createObjectStore("leaderboard", { keyPath: "id" })
        }
      }
    })
  }

  async savePlayer(player: PlayerData): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["players"], "readwrite")
      const store = transaction.objectStore("players")
      const request = store.put(player)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getPlayer(playerId: string): Promise<PlayerData | null> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["players"], "readonly")
      const store = transaction.objectStore("players")
      const request = store.get(playerId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async getPlayerByTwitchId(twitchId: string): Promise<PlayerData | null> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["players"], "readonly")
      const store = transaction.objectStore("players")
      const index = store.index("twitchId")
      const request = index.get(twitchId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async logEvent(event: Omit<GameEvent, "id" | "timestamp">): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    const fullEvent: GameEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["events"], "readwrite")
      const store = transaction.objectStore("events")
      const request = store.add(fullEvent)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getPlayerEvents(playerId: string, limit = 100): Promise<GameEvent[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["events"], "readonly")
      const store = transaction.objectStore("events")
      const index = store.index("playerId")
      const request = index.getAll(playerId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const events = request.result.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
        resolve(events)
      }
    })
  }

  async saveSession(session: GameSession): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["sessions"], "readwrite")
      const store = transaction.objectStore("sessions")
      const request = store.put(session)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getLeaderboard(
    limit = 10,
  ): Promise<Array<{ playerId: string; username: string; score: number; date: number }>> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["sessions"], "readonly")
      const store = transaction.objectStore("sessions")
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const sessions = request.result
          .filter((s) => s.finalScore !== undefined)
          .sort((a, b) => b.finalScore! - a.finalScore!)
          .slice(0, limit)

        // In a real app, we'd join with player data
        resolve(
          sessions.map((s) => ({
            playerId: s.playerId,
            username: `Player_${s.playerId.slice(0, 8)}`,
            score: s.finalScore!,
            date: s.endTime || s.startTime,
          })),
        )
      }
    })
  }
}

export const gameDB = new GameDatabase()
