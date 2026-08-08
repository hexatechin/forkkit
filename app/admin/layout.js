'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Package, ClipboardList, Settings, LogOut, Store, FolderTree } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (pathname === '/admin/login') { setReady(true); return }
    const t = typeof window!=='undefined' ? localStorage.getItem('kirano-token') : null
    if (!t) { router.replace('/admin/login'); return }
    fetch('/api/admin/me', { headers: { Authorization: `Bearer ${t}` }}).then(async r => {
      if (!r.ok) { localStorage.removeItem('kirano-token'); router.replace('/admin/login'); return }
      const d = await r.json(); setUser(d.user); setTenant(d.tenant); setReady(true)
    })
  }, [pathname])

  if (pathname === '/admin/login') return <>{children}</>
  if (!ready) return <div className="p-10 text-center text-muted-foreground">Loading...</div>

  const logout = () => { localStorage.clear(); router.replace('/admin/login') }
  const NavItem = ({href, icon:Icon, children}) => (
    <Link href={href} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${pathname===href ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>
      <Icon className="h-4 w-4"/>{children}
    </Link>
  )

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <aside className="w-64 bg-white border-r p-4 flex flex-col">
        <div className="flex items-center gap-2 font-bold mb-6 px-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-rose-500 to-fuchsia-500 text-white shadow">K</span>
          Kirano
        </div>
        <nav className="space-y-1 flex-1">
          <NavItem href="/admin" icon={LayoutDashboard}>Dashboard</NavItem>
          <NavItem href="/admin/categories" icon={FolderTree}>Categories</NavItem>
          <NavItem href="/admin/products" icon={Package}>Products</NavItem>
          <NavItem href="/admin/orders" icon={ClipboardList}>Orders</NavItem>
          <NavItem href="/admin/settings" icon={Settings}>Settings</NavItem>
        </nav>
        <div className="border-t pt-3 mt-3">
          <div className="px-2 py-2">
            <div className="text-xs text-muted-foreground">Signed in as</div>
            <div className="text-sm font-semibold">{user?.name}</div>
            <div className="text-xs text-muted-foreground capitalize">{user?.role} · {tenant?.name}</div>
          </div>
          {tenant?.slug && <Link href={`/t/${tenant.slug}`} target="_blank"><Button variant="outline" size="sm" className="w-full mb-2"><Store className="h-3.5 w-3.5 mr-2"/>View storefront</Button></Link>}
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start"><LogOut className="h-3.5 w-3.5 mr-2"/>Log out</Button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  )
}
