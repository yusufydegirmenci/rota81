import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './app/context'
import { Shell } from './app/layout'
import * as C from './pages/citizen'
import * as Y from './pages/city'
import * as N from './pages/national'
import { Login, Register, Welcome } from './pages/public'

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/giris" element={<Login />} />
          <Route path="/kayit" element={<Register />} />

          <Route path="/vatandas" element={<Shell role="citizen" nav={C.CITIZEN_NAV} />}>
            <Route index element={<C.Dashboard />} />
            <Route path="kart" element={<C.CardPage />} />
            <Route path="cuzdan" element={<C.Wallet />} />
            <Route path="yukle" element={<C.TopUp />} />
            <Route path="islemler" element={<C.History />} />
            <Route path="rota" element={<C.Planner />} />
            <Route path="yolculuk" element={<C.JourneyDetail />} />
            <Route path="hatlar" element={<C.Lines />} />
            <Route path="duraklar" element={<C.Stops />} />
            <Route path="sehirler" element={<C.CitiesGuide />} />
            <Route path="canli" element={<C.Live />} />
            <Route path="bildirimler" element={<C.Notifications />} />
            <Route path="kart-yonetimi" element={<C.CardManagement />} />
            <Route path="profil" element={<C.Profile />} />
            <Route path="guvenlik" element={<C.SecurityPage />} />
            <Route path="yardim" element={<C.Help />} />
          </Route>

          <Route path="/il" element={<Shell role="cityAdmin" nav={Y.CITY_NAV} admin />}>
            <Route index element={<Y.CityDashboard />} />
            <Route path="istatistik" element={<Y.CityStats />} />
            <Route path="filo" element={<Y.CityFleet />} />
            <Route path="hatlar" element={<Y.CityRoutes />} />
            <Route path="duraklar" element={<Y.CityStops />} />
            <Route path="isleticiler" element={<Y.CityOperators />} />
            <Route path="tarifeler" element={<Y.CityFares />} />
            <Route path="seferler" element={<Y.CitySchedules />} />
            <Route path="duyurular" element={<Y.CityAlerts />} />
            <Route path="raporlar" element={<Y.CityReports />} />
            <Route path="gecmis" element={<Y.CityHistory />} />
          </Route>

          <Route path="/ulusal" element={<Shell role="nationalAdmin" nav={N.NATIONAL_NAV} admin />}>
            <Route index element={<N.NationalOverview />} />
            <Route path="iller" element={<N.Provinces />} />
            <Route path="il-yoneticileri" element={<N.CityAdmins />} />
            <Route path="kullanicilar" element={<N.UsersPage />} />
            <Route path="roller" element={<N.RolesPage />} />
            <Route path="politikalar" element={<N.Policies />} />
            <Route path="tarife-onay" element={<N.FareApprovals />} />
            <Route path="raporlar" element={<N.NationalReports />} />
            <Route path="denetim" element={<N.AuditPage />} />
            <Route path="entegrasyonlar" element={<N.Integrations />} />
            <Route path="yapilandirma" element={<N.Config />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  )
}
