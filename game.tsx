"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  Coins,
  MapPin,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Zap,
  Star,
  Database,
  Trophy,
  LogOut,
} from "lucide-react"
import { gameDB } from "./lib/database"
import { twitchAuth } from "./lib/twitch-auth"

interface TwitchUser {
  id: string
  login: string
  display_name: string
  profile_image_url: string
  email?: string
}

interface Commodity {
  id: string
  name: string
  type: "streamer" | "game"
  basePrice: number
  currentPrice: number
  owned: number
  icon: string
}

interface Location {
  id: string
  name: string
  description: string
  commodities: Commodity[]
}

interface Player {
  cash: number
  channelPoints: number
  health: number
  capacity: number
  location: string
  day: number
  debt: number
}

interface Upgrade {
  id: string
  name: string
  description: string
  cost: number
  type: "capacity" | "health" | "luck"
  purchased: boolean
}

export default function StreamerWars() {
  const [gameStarted, setGameStarted] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [twitchUser, setTwitchUser] = useState<TwitchUser | null>(null)
  const [dbInitialized, setDbInitialized] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string>("")

  const [player, setPlayer] = useState<Player>({
    cash: 2000,
    channelPoints: 100,
    health: 100,
    capacity: 100,
    location: "twitch-hq",
    day: 1,
    debt: 5500,
  })

  const [locations] = useState<Location[]>([
    {
      id: "twitch-hq",
      name: "Twitch HQ",
      description: "The purple heart of streaming",
      commodities: [
        { id: "pokimane", name: "Pokimane", type: "streamer", basePrice: 150, currentPrice: 150, owned: 0, icon: "👑" },
        { id: "valorant", name: "Valorant", type: "game", basePrice: 80, currentPrice: 80, owned: 0, icon: "🎯" },
        { id: "xqc", name: "xQc", type: "streamer", basePrice: 200, currentPrice: 200, owned: 0, icon: "⚡" },
      ],
    },
    {
      id: "youtube-gaming",
      name: "YouTube Gaming",
      description: "Red corner of the streaming world",
      commodities: [
        {
          id: "mrbeast",
          name: "MrBeast Gaming",
          type: "streamer",
          basePrice: 300,
          currentPrice: 300,
          owned: 0,
          icon: "💰",
        },
        { id: "minecraft", name: "Minecraft", type: "game", basePrice: 120, currentPrice: 120, owned: 0, icon: "🧱" },
        {
          id: "pewdiepie",
          name: "PewDiePie",
          type: "streamer",
          basePrice: 250,
          currentPricee: 250,
          owned: 0,
          icon: "👊",
        },
      ],
    },
    {
      id: "discord-stage",
      name: "Discord Stage",
      description: "Voice chat central",
      commodities: [
        { id: "among-us", name: "Among Us", type: "game", basePrice: 60, currentPrice: 60, owned: 0, icon: "🚀" },
        {
          id: "corpse",
          name: "Corpse Husband",
          type: "streamer",
          basePrice: 180,
          currentPrice: 180,
          owned: 0,
          icon: "💀",
        },
        { id: "fall-guys", name: "Fall Guys", type: "game", basePrice: 90, currentPrice: 90, owned: 0, icon: "🏃" },
      ],
    },
    {
      id: "tiktok-live",
      name: "TikTok Live",
      description: "Short-form streaming paradise",
      commodities: [
        {
          id: "charli",
          name: "Charli D'Amelio",
          type: "streamer",
          basePrice: 220,
          currentPrice: 220,
          owned: 0,
          icon: "💃",
        },
        {
          id: "mobile-games",
          name: "Mobile Games",
          type: "game",
          basePrice: 40,
          currentPrice: 40,
          owned: 0,
          icon: "📱",
        },
        {
          id: "addison",
          name: "Addison Rae",
          type: "streamer",
          basePrice: 190,
          currentPrice: 190,
          owned: 0,
          icon: "✨",
        },
      ],
    },
  ])

  const [currentLocation, setCurrentLocation] = useState<Location>(locations[0])
  const [message, setMessage] = useState("")
  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    {
      id: "backpack",
      name: "Bigger Backpack",
      description: "Increase carrying capacity by 50",
      cost: 50,
      type: "capacity",
      purchased: false,
    },
    {
      id: "energy-drink",
      name: "Energy Drinks",
      description: "Restore 25 health",
      cost: 30,
      type: "health",
      purchased: false,
    },
    {
      id: "lucky-charm",
      name: "Lucky Charm",
      description: "Better random events",
      cost: 75,
      type: "luck",
      purchased: false,
    },
    {
      id: "premium-setup",
      name: "Premium Setup",
      description: "Increase capacity by 100",
      cost: 150,
      type: "capacity",
      purchased: false,
    },
  ])

  // Initialize database and check for existing auth
  useEffect(() => {
    const initApp = async () => {
      try {
        await gameDB.init()
        setDbInitialized(true)

        // Check for existing Twitch auth
        const storedUser = twitchAuth.getStoredUser()
        if (storedUser) {
          setTwitchUser(storedUser)
          await loadPlayerData(storedUser.id)
        }
      } catch (error) {
        console.error("Failed to initialize app:", error)
      }
    }

    initApp()
  }, [])

  // Load player data from database
  const loadPlayerData = async (twitchId: string) => {
    try {
      const playerData = await gameDB.getPlayerByTwitchId(twitchId)
      if (playerData) {
        setPlayer({
          cash: playerData.cash,
          channelPoints: playerData.channelPoints,
          health: playerData.health,
          capacity: playerData.capacity,
          location: playerData.location,
          day: playerData.day,
          debt: playerData.debt,
        })

        // Load inventory
        const location = locations.find((l) => l.id === playerData.location)
        if (location) {
          const updatedCommodities = location.commodities.map((commodity) => ({
            ...commodity,
            owned: playerData.inventory[commodity.id] || 0,
          }))
          setCurrentLocation({ ...location, commodities: updatedCommodities })
        }

        // Load upgrades
        setUpgrades((prev) =>
          prev.map((upgrade) => ({
            ...upgrade,
            purchased: playerData.upgrades.includes(upgrade.id),
          })),
        )
      }
    } catch (error) {
      console.error("Failed to load player data:", error)
    }
  }

  // Save player data to database
  const savePlayerData = async () => {
    if (!twitchUser || !dbInitialized) return

    try {
      const inventory: Record<string, number> = {}
      currentLocation.commodities.forEach((commodity) => {
        if (commodity.owned > 0) {
          inventory[commodity.id] = commodity.owned
        }
      })

      const playerData = {
        id: `player_${twitchUser.id}`,
        twitchId: twitchUser.id,
        username: twitchUser.display_name,
        cash: player.cash,
        channelPoints: player.channelPoints,
        health: player.health,
        capacity: player.capacity,
        location: player.location,
        day: player.day,
        debt: player.debt,
        inventory,
        upgrades: upgrades.filter((u) => u.purchased).map((u) => u.id),
        createdAt: Date.now(),
        lastPlayed: Date.now(),
      }

      await gameDB.savePlayer(playerData)
    } catch (error) {
      console.error("Failed to save player data:", error)
    }
  }

  // Log game event to database
  const logEvent = async (type: string, data: any) => {
    if (!twitchUser || !dbInitialized) return

    try {
      await gameDB.logEvent({
        type: type as any,
        playerId: `player_${twitchUser.id}`,
        data,
      })
    } catch (error) {
      console.error("Failed to log event:", error)
    }
  }

  // Auto-save player data periodically
  useEffect(() => {
    if (gameStarted && twitchUser) {
      const interval = setInterval(savePlayerData, 10000) // Save every 10 seconds
      return () => clearInterval(interval)
    }
  }, [gameStarted, twitchUser, player, currentLocation, upgrades])

  // Generate random price fluctuations
  useEffect(() => {
    if (!gameStarted) return

    const interval = setInterval(() => {
      setCurrentLocation((prev) => ({
        ...prev,
        commodities: prev.commodities.map((commodity) => ({
          ...commodity,
          currentPrice: Math.max(Math.floor(commodity.basePrice * (0.5 + Math.random())), 10),
        })),
      }))

      // Random events
      if (Math.random() < 0.1) {
        const events = [
          "A viral TikTok boosted streamer prices!",
          "Platform drama crashed some values!",
          "New game release shook the market!",
          "Streamer collaboration event happening!",
          "You found some channel points on the ground! (+25)",
        ]
        const event = events[Math.floor(Math.random() * events.length)]
        setMessage(event)

        if (event.includes("channel points")) {
          setPlayer((prev) => ({ ...prev, channelPoints: prev.channelPoints + 25 }))
        }

        // Log the event
        logEvent("event", { message: event })

        setTimeout(() => setMessage(""), 3000)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [gameStarted, currentLocation.id])

  const handleTwitchAuth = async () => {
    setIsAuthenticating(true)
    try {
      const user = await twitchAuth.authenticate()
      setTwitchUser(user)

      // Log authentication event
      await logEvent("auth", {
        twitchId: user.id,
        username: user.display_name,
        loginTime: Date.now(),
      })

      // Get initial channel points from Twitch
      const channelPoints = await twitchAuth.getChannelPoints()
      setPlayer((prev) => ({ ...prev, channelPoints }))

      // Load existing player data or create new
      await loadPlayerData(user.id)

      setGameStarted(true)
      setMessage(`Welcome ${user.display_name}! Ready to trade in the streaming stock market!`)

      // Create new game session
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setCurrentSessionId(sessionId)

      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Authentication failed:", error)
      setMessage("Authentication failed. Please try again.")
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleLogout = () => {
    twitchAuth.logout()
    setTwitchUser(null)
    setGameStarted(false)
    // Reset game state
    setPlayer({
      cash: 2000,
      channelPoints: 100,
      health: 100,
      capacity: 100,
      location: "twitch-hq",
      day: 1,
      debt: 5500,
    })
    setCurrentLocation(locations[0])
  }

  const buyItem = async (commodity: Commodity, quantity: number) => {
    const totalCost = commodity.currentPrice * quantity
    const totalWeight = getTotalWeight() + quantity

    if (totalCost > player.cash) {
      setMessage("Not enough cash!")
      return
    }

    if (totalWeight > player.capacity) {
      setMessage("Not enough carrying capacity!")
      return
    }

    setPlayer((prev) => ({ ...prev, cash: prev.cash - totalCost }))
    setCurrentLocation((prev) => ({
      ...prev,
      commodities: prev.commodities.map((c) => (c.id === commodity.id ? { ...c, owned: c.owned + quantity } : c)),
    }))

    // Log trade event
    await logEvent("trade", {
      action: "buy",
      commodity: commodity.name,
      quantity,
      price: commodity.currentPrice,
      totalCost,
      location: currentLocation.name,
    })

    setMessage(`Bought ${quantity}x ${commodity.name} for $${totalCost}`)
    setTimeout(() => setMessage(""), 2000)
  }

  const sellItem = async (commodity: Commodity, quantity: number) => {
    if (commodity.owned < quantity) {
      setMessage("You don't have enough to sell!")
      return
    }

    const totalEarned = commodity.currentPrice * quantity
    setPlayer((prev) => ({ ...prev, cash: prev.cash + totalEarned }))
    setCurrentLocation((prev) => ({
      ...prev,
      commodities: prev.commodities.map((c) => (c.id === commodity.id ? { ...c, owned: c.owned - quantity } : c)),
    }))

    // Log trade event
    await logEvent("trade", {
      action: "sell",
      commodity: commodity.name,
      quantity,
      price: commodity.currentPrice,
      totalEarned,
      location: currentLocation.name,
    })

    setMessage(`Sold ${quantity}x ${commodity.name} for $${totalEarned}`)
    setTimeout(() => setMessage(""), 2000)
  }

  const travelTo = async (locationId: string) => {
    const newLocation = locations.find((l) => l.id === locationId)
    if (!newLocation) return

    // Transfer owned items to new location
    const ownedItems = currentLocation.commodities.filter((c) => c.owned > 0)
    const updatedCommodities = newLocation.commodities.map((commodity) => {
      const ownedItem = ownedItems.find((item) => item.id === commodity.id)
      return ownedItem ? { ...commodity, owned: ownedItem.owned } : commodity
    })

    setCurrentLocation({ ...newLocation, commodities: updatedCommodities })
    setPlayer((prev) => ({
      ...prev,
      location: locationId,
      day: prev.day + 1,
      health: Math.max(prev.health - 5, 0), // Travel costs health
    }))

    // Log travel event
    await logEvent("travel", {
      from: currentLocation.name,
      to: newLocation.name,
      day: player.day + 1,
      healthCost: 5,
    })

    setMessage(`Traveled to ${newLocation.name}`)
    setTimeout(() => setMessage(""), 2000)
  }

  const purchaseUpgrade = async (upgrade: Upgrade) => {
    if (player.channelPoints < upgrade.cost) {
      setMessage("Not enough channel points!")
      return
    }

    if (upgrade.purchased) {
      setMessage("Already purchased!")
      return
    }

    setPlayer((prev) => {
      const newPlayer = { ...prev, channelPoints: prev.channelPoints - upgrade.cost }

      switch (upgrade.type) {
        case "capacity":
          newPlayer.capacity += upgrade.id === "backpack" ? 50 : 100
          break
        case "health":
          newPlayer.health = Math.min(newPlayer.health + 25, 100)
          break
      }

      return newPlayer
    })

    setUpgrades((prev) => prev.map((u) => (u.id === upgrade.id ? { ...u, purchased: true } : u)))

    // Log upgrade event
    await logEvent("upgrade", {
      upgrade: upgrade.name,
      cost: upgrade.cost,
      type: upgrade.type,
    })

    setMessage(`Purchased ${upgrade.name}!`)
    setTimeout(() => setMessage(""), 2000)
  }

  const getTotalWeight = () => {
    return currentLocation.commodities.reduce((total, commodity) => total + commodity.owned, 0)
  }

  const getTotalValue = () => {
    return currentLocation.commodities.reduce((total, commodity) => total + commodity.owned * commodity.currentPrice, 0)
  }

  if (!dbInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center gap-4 p-8">
            <Database className="w-12 h-12 animate-spin text-purple-400" />
            <p className="text-center text-muted-foreground">Initializing game database...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!gameStarted || !twitchUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Streamer Stock
            </CardTitle>
            <p className="text-muted-foreground">Trade streaming stocks like a Wall Street pro!</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <p>📈 Trade streamer and game stocks across platforms</p>
              <p>💰 Use channel points for upgrades</p>
              <p>📊 Watch market fluctuations</p>
              <p>🚀 Pay off your $5,500 debt in 30 days!</p>
              <p>💾 All progress saved to local database</p>
            </div>
            <Button
              onClick={handleTwitchAuth}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Connecting to Twitch...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Connect with Twitch
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={twitchUser.profile_image_url || "/placeholder.svg"} alt={twitchUser.display_name} />
                  <AvatarFallback>{twitchUser.display_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{twitchUser.display_name}</p>
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="w-3 h-3 mr-1" />
                    {currentLocation.name}
                  </Badge>
                </div>
                <Badge variant="secondary">Day {player.day}/30</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="font-mono">${player.cash}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-purple-500" />
                  <span className="font-mono">{player.channelPoints} CP</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-red-500">Debt: ${player.debt}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Health</span>
                <span>{player.health}/100</span>
              </div>
              <Progress value={player.health} className="h-2" />
              <div className="flex justify-between text-xs">
                <span>Capacity</span>
                <span>
                  {getTotalWeight()}/{player.capacity}
                </span>
              </div>
              <Progress value={(getTotalWeight() / player.capacity) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Message */}
        {message && (
          <Card className="border-yellow-500 bg-yellow-50">
            <CardContent className="p-3">
              <p className="text-yellow-800 text-center font-medium">{message}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="market" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="travel">Travel</TabsTrigger>
            <TabsTrigger value="upgrades">Upgrades</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="market" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  {currentLocation.name} Market
                </CardTitle>
                <p className="text-muted-foreground">{currentLocation.description}</p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {currentLocation.commodities.map((commodity) => (
                    <Card key={commodity.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{commodity.icon}</span>
                          <div>
                            <h3 className="font-semibold">{commodity.name}</h3>
                            <Badge variant={commodity.type === "streamer" ? "default" : "secondary"}>
                              {commodity.type}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-lg">${commodity.currentPrice}</span>
                            {commodity.currentPrice > commodity.basePrice ? (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : commodity.currentPrice < commodity.basePrice ? (
                              <TrendingDown className="w-4 h-4 text-red-500" />
                            ) : null}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => buyItem(commodity, 1)}
                              disabled={player.cash < commodity.currentPrice || getTotalWeight() >= player.capacity}
                            >
                              Buy 1
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => buyItem(commodity, 5)}
                              disabled={
                                player.cash < commodity.currentPrice * 5 || getTotalWeight() + 5 > player.capacity
                              }
                            >
                              Buy 5
                            </Button>
                            {commodity.owned > 0 && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => sellItem(commodity, 1)}>
                                  Sell 1
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => sellItem(commodity, Math.min(commodity.owned, 5))}
                                >
                                  Sell {Math.min(commodity.owned, 5)}
                                </Button>
                              </>
                            )}
                          </div>
                          {commodity.owned > 0 && (
                            <p className="text-sm text-muted-foreground">Owned: {commodity.owned}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="travel" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Travel to Platform
                </CardTitle>
                <p className="text-muted-foreground">Each trip costs 5 health and advances 1 day</p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {locations.map((location) => (
                    <Card
                      key={location.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        location.id === currentLocation.id ? "border-purple-500 bg-purple-50" : "hover:bg-gray-50"
                      }`}
                      onClick={() => location.id !== currentLocation.id && travelTo(location.id)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{location.name}</h3>
                          {location.id === currentLocation.id && <Badge>Current</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{location.description}</p>
                        <div className="flex gap-1">
                          {location.commodities.map((commodity) => (
                            <span key={commodity.id} className="text-lg">
                              {commodity.icon}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upgrades" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Channel Point Upgrades
                </CardTitle>
                <p className="text-muted-foreground">
                  Spend your {player.channelPoints} channel points on permanent upgrades
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {upgrades.map((upgrade) => (
                    <Card key={upgrade.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{upgrade.name}</h3>
                          <Badge variant={upgrade.purchased ? "default" : "outline"}>{upgrade.cost} CP</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{upgrade.description}</p>
                        <Button
                          onClick={() => purchaseUpgrade(upgrade)}
                          disabled={upgrade.purchased || player.channelPoints < upgrade.cost}
                          className="w-full"
                          variant={upgrade.purchased ? "secondary" : "default"}
                        >
                          {upgrade.purchased ? "Purchased" : "Purchase"}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Your Portfolio
                </CardTitle>
                <p className="text-muted-foreground">
                  Total value: ${getTotalValue()} | Weight: {getTotalWeight()}/{player.capacity}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentLocation.commodities.filter((c) => c.owned > 0).length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No items in inventory. Visit the market to start trading!
                    </p>
                  ) : (
                    currentLocation.commodities
                      .filter((c) => c.owned > 0)
                      .map((commodity) => (
                        <Card key={commodity.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{commodity.icon}</span>
                              <div>
                                <h3 className="font-semibold">{commodity.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {commodity.owned} owned • ${commodity.currentPrice} each
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-lg">${commodity.owned * commodity.currentPrice}</p>
                              <p className="text-sm text-muted-foreground">total value</p>
                            </div>
                          </div>
                        </Card>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Game Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Current Day:</span>
                    <span className="font-mono">{player.day}/30</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Worth:</span>
                    <span className="font-mono">${player.cash + getTotalValue()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Debt Remaining:</span>
                    <span className="font-mono text-red-500">${player.debt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Health:</span>
                    <span className="font-mono">{player.health}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capacity Used:</span>
                    <span className="font-mono">
                      {getTotalWeight()}/{player.capacity}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Player Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage
                        src={twitchUser.profile_image_url || "/placeholder.svg"}
                        alt={twitchUser.display_name}
                      />
                      <AvatarFallback>{twitchUser.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{twitchUser.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{twitchUser.login}</p>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Channel Points:</span>
                    <span className="font-mono text-purple-600">{player.channelPoints} CP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Location:</span>
                    <span className="font-mono">{currentLocation.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Upgrades Owned:</span>
                    <span className="font-mono">
                      {upgrades.filter((u) => u.purchased).length}/{upgrades.length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
