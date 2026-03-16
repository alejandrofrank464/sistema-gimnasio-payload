'use client'

import React, { useEffect, useMemo, useState } from 'react'

type User = {
  email?: string
  role?: 'admin' | 'staff'
}

type Cliente = {
  id: number
  name: string
  lastName: string
  phone: string
  email?: string
  vip?: boolean
  zumba?: boolean
  box?: boolean
  turno?: string
  metodoPago?: 'Efectivo' | 'Tarjeta'
}

type Pago = {
  id: number
  monto: number
  metodoPago?: 'Efectivo' | 'Tarjeta'
  tipoServicio: string
  fechaPago: string
  mesPago: number
  anioPago: number
  turno?: string
  cliente?: number | Cliente | null
}

type Log = {
  id: number
  accion: string
  entidad: string
  usuario?: string
  nombreCompleto?: string
  createdAt: string
}

type ConfigPrecios = {
  precio_normal: number
  precio_vip: number
  precio_zumba_o_box: number
  precio_zumba_y_box: number
  precio_vip_zumba_y_box: number
}

type TabKey = 'clientes' | 'pagos' | 'horario' | 'ajustes' | 'logs'

const TURNOS = [
  'de 7:00 am a 8:00 am',
  'de 8:00 am a 9:00 am',
  'de 9:00 am a 10:00 am',
  'de 10:00 am a 11:00 am',
  'de 11:00 am a 12:00 pm',
  'de 1:00 pm a 2:00 pm',
  'de 2:00 pm a 3:00 pm',
  'de 3:00 pm a 4:00 pm',
  'de 4:00 pm a 5:00 pm',
  'de 5:00 pm a 6:00 pm',
  'de 6:00 pm a 7:00 pm',
  'de 7:00 pm a 8:00 pm',
]

const getClientId = (cliente: Pago['cliente']): number | null => {
  if (!cliente) {
    return null
  }

  if (typeof cliente === 'number') {
    return cliente
  }

  return cliente.id ?? null
}

const getClientName = (cliente: Pago['cliente']): string => {
  if (!cliente || typeof cliente === 'number') {
    return 'Sin cliente'
  }

  return `${cliente.name} ${cliente.lastName}`
}

const parseTurno = (turno?: string): number | null => {
  if (!turno) {
    return null
  }

  const match = turno.match(/de (\d+):00 (am|pm)/i)
  if (!match) {
    return null
  }

  let hour = Number(match[1])
  const period = match[2].toLowerCase()

  if (period === 'pm' && hour !== 12) {
    hour += 12
  }

  if (period === 'am' && hour === 12) {
    hour = 0
  }

  return hour
}

export default function FrontendPage() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('clientes')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [precios, setPrecios] = useState<ConfigPrecios | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [clienteForm, setClienteForm] = useState<Omit<Cliente, 'id'>>({
    name: '',
    lastName: '',
    phone: '',
    email: '',
    vip: false,
    zumba: false,
    box: false,
    turno: '',
    metodoPago: 'Efectivo',
  })
  const [editingClienteId, setEditingClienteId] = useState<number | null>(null)

  const [pagoForm, setPagoForm] = useState({
    clienteId: '',
    tipoServicio: 'Normal',
    metodoPago: 'Efectivo',
    turno: '',
    mesPago: String(new Date().getMonth()),
    anioPago: String(new Date().getFullYear()),
  })
  const [editingPagoId, setEditingPagoId] = useState<number | null>(null)

  const [filtroCliente, setFiltroCliente] = useState('')
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null)
  const [filtroMes, setFiltroMes] = useState(String(new Date().getMonth()))
  const [filtroAnio, setFiltroAnio] = useState(String(new Date().getFullYear()))
  const [filtroEntidad, setFiltroEntidad] = useState('')
  const [filtroAccion, setFiltroAccion] = useState('')

  const authFetch = async (url: string, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers)
    headers.set('Content-Type', 'application/json')

    if (token) {
      headers.set('Authorization', `JWT ${token}`)
    }

    return fetch(url, {
      ...init,
      headers,
    })
  }

  const fetchAllData = async (): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const [clientesRes, pagosRes, logsRes, preciosRes] = await Promise.all([
        authFetch('/api/clientes?limit=200&depth=1&sort=name'),
        authFetch('/api/pagos?limit=500&depth=1&sort=-fechaPago'),
        authFetch('/api/logs?limit=500&depth=0&sort=-createdAt'),
        fetch('/api/configuraciones/precios'),
      ])

      if (!clientesRes.ok || !pagosRes.ok || !logsRes.ok || !preciosRes.ok) {
        throw new Error('No se pudieron cargar los datos.')
      }

      const clientesJson = (await clientesRes.json()) as { docs?: Cliente[] }
      const pagosJson = (await pagosRes.json()) as { docs?: Pago[] }
      const logsJson = (await logsRes.json()) as { docs?: Log[] }
      const preciosJson = (await preciosRes.json()) as { data?: ConfigPrecios }

      setClientes(clientesJson.docs ?? [])
      setPagos(pagosJson.docs ?? [])
      setLogs(logsJson.docs ?? [])
      setPrecios(preciosJson.data ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const stored = window.sessionStorage.getItem('gym_token')
    const rawUser = window.sessionStorage.getItem('gym_user')

    if (stored) {
      setToken(stored)
    }

    if (rawUser) {
      setUser(JSON.parse(rawUser) as User)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }

    fetchAllData().catch(() => {
      setError('No se pudo cargar el dashboard')
      setLoading(false)
    })
  }, [token])

  const pagosFiltrados = useMemo(() => {
    return pagos.filter((p) => {
      return String(p.mesPago) === filtroMes && String(p.anioPago) === filtroAnio
    })
  }, [pagos, filtroMes, filtroAnio])

  const clientesFiltrados = useMemo(() => {
    if (!filtroCliente.trim()) {
      return clientes
    }

    const text = filtroCliente.toLowerCase().trim()

    return clientes.filter((c) => {
      return (
        c.name.toLowerCase().includes(text) ||
        c.lastName.toLowerCase().includes(text) ||
        c.phone.toLowerCase().includes(text) ||
        (c.email || '').toLowerCase().includes(text)
      )
    })
  }, [clientes, filtroCliente])

  const logsFiltrados = useMemo(() => {
    return logs.filter((log) => {
      const byEntidad = !filtroEntidad || log.entidad === filtroEntidad
      const byAccion = !filtroAccion || log.accion === filtroAccion
      return byEntidad && byAccion
    })
  }, [logs, filtroAccion, filtroEntidad])

  const selectedCliente = useMemo(() => {
    if (!selectedClienteId) {
      return null
    }

    return clientes.find((c) => c.id === selectedClienteId) || null
  }, [clientes, selectedClienteId])

  const selectedClientePagos = useMemo(() => {
    if (!selectedClienteId) {
      return []
    }

    return pagos.filter((p) => getClientId(p.cliente) === selectedClienteId)
  }, [pagos, selectedClienteId])

  const horarioRows = useMemo(() => {
    const rows = TURNOS.map((turno) => ({
      turno,
      clientes: [] as string[],
    }))

    const now = new Date()
    const mes = now.getMonth()
    const anio = now.getFullYear()

    const pagosActivos = pagos.filter((p) => p.mesPago === mes && p.anioPago === anio)

    for (const pago of pagosActivos) {
      const hour = parseTurno(pago.turno)
      if (hour == null) {
        continue
      }

      const row = rows.find((r) => parseTurno(r.turno) === hour)
      if (!row) {
        continue
      }

      row.clientes.push(getClientName(pago.cliente))
    }

    return rows
  }, [pagos])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })

    if (!response.ok) {
      setError('Credenciales invalidas')
      return
    }

    const json = (await response.json()) as { token: string; user: User }
    setToken(json.token)
    setUser(json.user)
    window.sessionStorage.setItem('gym_token', json.token)
    window.sessionStorage.setItem('gym_user', JSON.stringify(json.user))
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    setClientes([])
    setPagos([])
    setLogs([])
    window.sessionStorage.removeItem('gym_token')
    window.sessionStorage.removeItem('gym_user')
  }

  const handleCreateCliente = async (e: React.FormEvent) => {
    e.preventDefault()

    const endpoint = editingClienteId ? `/api/clientes/${editingClienteId}` : '/api/clientes'
    const method = editingClienteId ? 'PATCH' : 'POST'

    const response = await authFetch(endpoint, {
      method,
      body: JSON.stringify({
        ...clienteForm,
        turno: clienteForm.vip ? null : clienteForm.turno || null,
      }),
    })

    if (!response.ok) {
      setError('No se pudo crear el cliente')
      return
    }

    setEditingClienteId(null)
    setClienteForm({
      name: '',
      lastName: '',
      phone: '',
      email: '',
      vip: false,
      zumba: false,
      box: false,
      turno: '',
      metodoPago: 'Efectivo',
    })

    await fetchAllData()
  }

  const calcMonto = (tipoServicio: string): number => {
    if (!precios) {
      return 0
    }

    if (tipoServicio === 'VIP + Zumba y Box') return precios.precio_vip_zumba_y_box
    if (tipoServicio === 'VIP') return precios.precio_vip
    if (tipoServicio === 'Zumba y Box') return precios.precio_zumba_y_box
    if (tipoServicio === 'Zumba' || tipoServicio === 'Box') return precios.precio_zumba_o_box
    return precios.precio_normal
  }

  const handleCreatePago = async (e: React.FormEvent) => {
    e.preventDefault()

    const clienteId = Number(pagoForm.clienteId)
    if (!clienteId) {
      setError('Debes seleccionar un cliente')
      return
    }

    const now = new Date()
    const fechaPago = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const endpoint = editingPagoId ? `/api/pagos/${editingPagoId}` : '/api/pagos'
    const method = editingPagoId ? 'PATCH' : 'POST'

    const response = await authFetch(endpoint, {
      method,
      body: JSON.stringify({
        cliente: clienteId,
        metodoPago: pagoForm.metodoPago,
        tipoServicio: pagoForm.tipoServicio,
        turno:
          pagoForm.tipoServicio === 'VIP' || pagoForm.tipoServicio === 'VIP + Zumba y Box'
            ? null
            : pagoForm.turno || null,
        monto: calcMonto(pagoForm.tipoServicio),
        fechaPago,
        mesPago: Number(pagoForm.mesPago),
        anioPago: Number(pagoForm.anioPago),
      }),
    })

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as {
        errors?: Array<{ message?: string }>
      } | null
      setError(errorBody?.errors?.[0]?.message || 'No se pudo crear el pago')
      return
    }

    setEditingPagoId(null)
    setPagoForm({
      clienteId: '',
      tipoServicio: 'Normal',
      metodoPago: 'Efectivo',
      turno: '',
      mesPago: String(new Date().getMonth()),
      anioPago: String(new Date().getFullYear()),
    })

    await fetchAllData()
  }

  const startEditCliente = (cliente: Cliente) => {
    setEditingClienteId(cliente.id)
    setClienteForm({
      name: cliente.name,
      lastName: cliente.lastName,
      phone: cliente.phone,
      email: cliente.email || '',
      vip: Boolean(cliente.vip),
      zumba: Boolean(cliente.zumba),
      box: Boolean(cliente.box),
      turno: cliente.turno || '',
      metodoPago: cliente.metodoPago || 'Efectivo',
    })
  }

  const startEditPago = (pago: Pago) => {
    const cid = getClientId(pago.cliente)
    setEditingPagoId(pago.id)
    setPagoForm({
      clienteId: cid ? String(cid) : '',
      tipoServicio: pago.tipoServicio,
      metodoPago: pago.metodoPago || 'Efectivo',
      turno: pago.turno || '',
      mesPago: String(pago.mesPago),
      anioPago: String(pago.anioPago),
    })
  }

  const handleDeleteCliente = async (id: number) => {
    const response = await authFetch(`/api/clientes/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      setError('No se pudo eliminar cliente')
      return
    }

    await fetchAllData()
  }

  const handleDeletePago = async (id: number) => {
    const response = await authFetch(`/api/pagos/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      setError('No se pudo eliminar pago')
      return
    }

    await fetchAllData()
  }

  const savePrecios = async (values: ConfigPrecios) => {
    const entries = Object.entries(values)

    for (const [clave, valor] of entries) {
      const response = await fetch('/api/configuraciones/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clave,
          valor,
        }),
      })

      if (!response.ok) {
        setError('Error guardando precios')
        return
      }
    }

    await fetchAllData()
  }

  const uploadLogo = async (file: File) => {
    const form = new FormData()
    form.append('logo', file)

    const response = await fetch('/api/configuraciones/logo', {
      method: 'POST',
      body: form,
    })

    if (!response.ok) {
      setError('No se pudo subir logo')
      return
    }

    await fetchAllData()
  }

  if (!token) {
    return (
      <div className="auth-shell">
        <form className="auth-card" onSubmit={handleLogin}>
          <h1>Gym Dashboard</h1>
          <p>Accede con tu usuario de Payload.</p>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit">Entrar</button>
          {error && <div className="error">{error}</div>}
        </form>
      </div>
    )
  }

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <div>
          <h1>Sistema Gimnasio</h1>
          <small>
            {user?.email} {user?.role ? `(${user.role})` : ''}
          </small>
        </div>
        <div className="topbar-actions">
          <button onClick={() => fetchAllData()} disabled={loading}>
            Recargar
          </button>
          <button onClick={handleLogout}>Salir</button>
        </div>
      </header>

      <nav className="tabs">
        {[
          ['clientes', 'Clientes'],
          ['pagos', 'Pagos'],
          ['horario', 'Horario'],
          ['ajustes', 'Ajustes'],
          ['logs', 'Logs'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={activeTab === key ? 'tab active' : 'tab'}
            onClick={() => setActiveTab(key as TabKey)}
          >
            {label}
          </button>
        ))}
      </nav>

      {error && <div className="error inline">{error}</div>}

      {activeTab === 'clientes' && (
        <section className="panel">
          <h2>Clientes</h2>
          <div className="grid-2">
            <form className="card" onSubmit={handleCreateCliente}>
              <h3>
                {editingClienteId ? `Editando cliente #${editingClienteId}` : 'Nuevo cliente'}
              </h3>
              <input
                placeholder="Nombre"
                value={clienteForm.name}
                onChange={(e) => setClienteForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
              <input
                placeholder="Apellido"
                value={clienteForm.lastName}
                onChange={(e) => setClienteForm((prev) => ({ ...prev, lastName: e.target.value }))}
                required
              />
              <input
                placeholder="Telefono"
                value={clienteForm.phone}
                onChange={(e) => setClienteForm((prev) => ({ ...prev, phone: e.target.value }))}
                required
              />
              <input
                placeholder="Email"
                value={clienteForm.email || ''}
                onChange={(e) => setClienteForm((prev) => ({ ...prev, email: e.target.value }))}
              />
              <select
                value={clienteForm.metodoPago}
                onChange={(e) =>
                  setClienteForm((prev) => ({
                    ...prev,
                    metodoPago: e.target.value as 'Efectivo' | 'Tarjeta',
                  }))
                }
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
              </select>
              <select
                value={clienteForm.turno || ''}
                onChange={(e) => setClienteForm((prev) => ({ ...prev, turno: e.target.value }))}
                disabled={Boolean(clienteForm.vip)}
              >
                <option value="">Sin turno</option>
                {TURNOS.map((turno) => (
                  <option value={turno} key={turno}>
                    {turno}
                  </option>
                ))}
              </select>
              <label className="check">
                <input
                  type="checkbox"
                  checked={Boolean(clienteForm.vip)}
                  onChange={(e) => setClienteForm((prev) => ({ ...prev, vip: e.target.checked }))}
                />
                VIP
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={Boolean(clienteForm.zumba)}
                  onChange={(e) => setClienteForm((prev) => ({ ...prev, zumba: e.target.checked }))}
                />
                Zumba
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={Boolean(clienteForm.box)}
                  onChange={(e) => setClienteForm((prev) => ({ ...prev, box: e.target.checked }))}
                />
                Box
              </label>
              <button type="submit">Crear cliente</button>
              {editingClienteId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingClienteId(null)
                    setClienteForm({
                      name: '',
                      lastName: '',
                      phone: '',
                      email: '',
                      vip: false,
                      zumba: false,
                      box: false,
                      turno: '',
                      metodoPago: 'Efectivo',
                    })
                  }}
                >
                  Cancelar edicion
                </button>
              )}
            </form>

            <div className="card">
              <h3>Listado</h3>
              <input
                placeholder="Buscar por nombre, telefono o email"
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
              />
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Telefono</th>
                      <th>VIP</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesFiltrados.map((c) => (
                      <tr key={c.id}>
                        <td>
                          {c.name} {c.lastName}
                        </td>
                        <td>{c.phone}</td>
                        <td>{c.vip ? 'Si' : 'No'}</td>
                        <td>
                          <button onClick={() => setSelectedClienteId(c.id)}>Detalle</button>
                          <button onClick={() => startEditCliente(c)}>Editar</button>
                          <button onClick={() => handleDeleteCliente(c.id)}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedCliente && (
                <div className="detail-box">
                  <h4>
                    {selectedCliente.name} {selectedCliente.lastName}
                  </h4>
                  <p>
                    Telefono: {selectedCliente.phone} | Email: {selectedCliente.email || '-'}
                  </p>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Servicio</th>
                          <th>Monto</th>
                          <th>Mes/Anio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClientePagos.map((p) => (
                          <tr key={p.id}>
                            <td>{p.fechaPago}</td>
                            <td>{p.tipoServicio}</td>
                            <td>{p.monto}</td>
                            <td>
                              {p.mesPago}/{p.anioPago}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'pagos' && (
        <section className="panel">
          <h2>Pagos</h2>
          <div className="grid-2">
            <form className="card" onSubmit={handleCreatePago}>
              <h3>{editingPagoId ? `Editando pago #${editingPagoId}` : 'Nuevo pago'}</h3>
              <select
                value={pagoForm.clienteId}
                onChange={(e) => setPagoForm((prev) => ({ ...prev, clienteId: e.target.value }))}
                required
              >
                <option value="">Selecciona cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.lastName}
                  </option>
                ))}
              </select>
              <select
                value={pagoForm.tipoServicio}
                onChange={(e) => setPagoForm((prev) => ({ ...prev, tipoServicio: e.target.value }))}
              >
                <option value="Normal">Normal</option>
                <option value="VIP">VIP</option>
                <option value="Zumba">Zumba</option>
                <option value="Box">Box</option>
                <option value="Zumba y Box">Zumba y Box</option>
                <option value="VIP + Zumba y Box">VIP + Zumba y Box</option>
              </select>
              <select
                value={pagoForm.metodoPago}
                onChange={(e) =>
                  setPagoForm((prev) => ({
                    ...prev,
                    metodoPago: e.target.value as 'Efectivo' | 'Tarjeta',
                  }))
                }
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
              </select>
              <select
                value={pagoForm.turno}
                onChange={(e) => setPagoForm((prev) => ({ ...prev, turno: e.target.value }))}
                disabled={
                  pagoForm.tipoServicio === 'VIP' || pagoForm.tipoServicio === 'VIP + Zumba y Box'
                }
              >
                <option value="">Sin turno</option>
                {TURNOS.map((turno) => (
                  <option key={turno} value={turno}>
                    {turno}
                  </option>
                ))}
              </select>
              <div className="grid-inline">
                <label>
                  Mes
                  <input
                    type="number"
                    min={0}
                    max={11}
                    value={pagoForm.mesPago}
                    onChange={(e) => setPagoForm((prev) => ({ ...prev, mesPago: e.target.value }))}
                  />
                </label>
                <label>
                  Anio
                  <input
                    type="number"
                    value={pagoForm.anioPago}
                    onChange={(e) => setPagoForm((prev) => ({ ...prev, anioPago: e.target.value }))}
                  />
                </label>
              </div>
              <button type="submit">Crear pago</button>
              {editingPagoId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPagoId(null)
                    setPagoForm({
                      clienteId: '',
                      tipoServicio: 'Normal',
                      metodoPago: 'Efectivo',
                      turno: '',
                      mesPago: String(new Date().getMonth()),
                      anioPago: String(new Date().getFullYear()),
                    })
                  }}
                >
                  Cancelar edicion
                </button>
              )}
            </form>

            <div className="card">
              <h3>Listado pagos</h3>
              <div className="grid-inline">
                <label>
                  Mes
                  <input
                    type="number"
                    min={0}
                    max={11}
                    value={filtroMes}
                    onChange={(e) => setFiltroMes(e.target.value)}
                  />
                </label>
                <label>
                  Anio
                  <input
                    type="number"
                    value={filtroAnio}
                    onChange={(e) => setFiltroAnio(e.target.value)}
                  />
                </label>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Servicio</th>
                      <th>Monto</th>
                      <th>Turno</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagosFiltrados.map((p) => (
                      <tr key={p.id}>
                        <td>{getClientName(p.cliente)}</td>
                        <td>{p.tipoServicio}</td>
                        <td>{p.monto}</td>
                        <td>{p.turno || '-'}</td>
                        <td>
                          <button onClick={() => startEditPago(p)}>Editar</button>
                          <button onClick={() => handleDeletePago(p.id)}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'horario' && (
        <section className="panel">
          <h2>Horario</h2>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Turno</th>
                    <th>Clientes activos</th>
                  </tr>
                </thead>
                <tbody>
                  {horarioRows.map((row) => (
                    <tr key={row.turno}>
                      <td>{row.turno}</td>
                      <td>{row.clientes.length ? row.clientes.join(', ') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'ajustes' && (
        <section className="panel">
          <h2>Ajustes</h2>
          <div className="grid-2">
            <div className="card">
              <h3>Precios</h3>
              {precios && <PrecioForm current={precios} onSave={savePrecios} />}
            </div>
            <div className="card">
              <h3>Logo</h3>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadLogo(file)
                }}
              />
            </div>
          </div>
        </section>
      )}

      {activeTab === 'logs' && (
        <section className="panel">
          <h2>Logs</h2>
          <div className="card">
            <div className="grid-inline">
              <select value={filtroEntidad} onChange={(e) => setFiltroEntidad(e.target.value)}>
                <option value="">Todas las entidades</option>
                <option value="Cliente">Cliente</option>
                <option value="Pago">Pago</option>
              </select>
              <select value={filtroAccion} onChange={(e) => setFiltroAccion(e.target.value)}>
                <option value="">Todas las acciones</option>
                <option value="crear_cliente">crear_cliente</option>
                <option value="editar_cliente">editar_cliente</option>
                <option value="eliminar_cliente">eliminar_cliente</option>
                <option value="crear_pago">crear_pago</option>
                <option value="editar_pago">editar_pago</option>
                <option value="eliminar_pago">eliminar_pago</option>
              </select>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Accion</th>
                    <th>Entidad</th>
                    <th>Usuario</th>
                    <th>Nombre</th>
                  </tr>
                </thead>
                <tbody>
                  {logsFiltrados.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.createdAt).toLocaleString()}</td>
                      <td>{log.accion}</td>
                      <td>{log.entidad}</td>
                      <td>{log.usuario || '-'}</td>
                      <td>{log.nombreCompleto || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

type PrecioFormProps = {
  current: ConfigPrecios
  onSave: (next: ConfigPrecios) => Promise<void>
}

function PrecioForm({ current, onSave }: PrecioFormProps) {
  const [local, setLocal] = useState<ConfigPrecios>(current)

  useEffect(() => {
    setLocal(current)
  }, [current])

  return (
    <form
      className="price-form"
      onSubmit={async (e) => {
        e.preventDefault()
        await onSave(local)
      }}
    >
      {Object.entries(local).map(([key, value]) => (
        <label key={key}>
          {key}
          <input
            type="number"
            value={value}
            onChange={(e) =>
              setLocal((prev) => ({
                ...prev,
                [key]: Number(e.target.value),
              }))
            }
          />
        </label>
      ))}
      <button type="submit">Guardar precios</button>
    </form>
  )
}
