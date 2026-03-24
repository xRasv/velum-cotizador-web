import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer'

// Register fonts for a premium look (Inter)
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fMZhrib2Bg-4.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf', fontWeight: 700 }
  ]
})

// Types
type Addon = { id: string; addon_name: string; price: number; is_selected: boolean }
type Item = { id: string; room_name: string; product_name: string; width: number; height: number; fabric_name: string; base_price: number; image_url: string; addons: Addon[] }
type Invoice = { id: string; client_name: string; reference_code: string; valid_until: string; total_amount: number; items: Item[] }

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    backgroundColor: '#ffffff',
    color: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottom: '2px solid #f1f5f9',
    paddingBottom: 20,
  },
  logo: {
    width: 120,
    height: 35,
    objectFit: 'contain',
  },
  titleArea: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  clientInfoBox: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clientLabel: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 6,
    fontWeight: 600,
    letterSpacing: 1,
  },
  clientValue: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1e293b',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 20,
    marginTop: 10,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 24,
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 24,
  },
  itemImage: {
    width: 120,
    height: 120,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    objectFit: 'cover',
    marginRight: 20,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemRoom: {
    fontSize: 10,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '4 8',
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
    fontWeight: 600,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#0f172a',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 600,
    color: '#0f172a',
  },
  specsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 30, // Needs custom spacing in react-pdf
  },
  specBox: {
    marginRight: 30,
  },
  specLabel: {
    fontSize: 9,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: 700,
    marginBottom: 4,
  },
  specValue: {
    fontSize: 12,
    color: '#334155',
    fontWeight: 600,
  },
  addonsContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  addonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottom: '1px solid #e2e8f0',
  },
  addonName: {
    fontSize: 11,
    color: '#334155',
  },
  addonPrice: {
    fontSize: 11,
    color: '#64748b',
  },
  totalSection: {
    marginTop: 20,
    alignItems: 'flex-end',
    backgroundColor: '#f8fafc',
    padding: 24,
    borderRadius: 12,
  },
  totalLabel: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: 700,
    marginBottom: 8,
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: 700,
    color: '#2563eb', // velum blue
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 10,
    borderTop: '1px solid #f1f5f9',
    paddingTop: 15,
  }
})

// Helper functions
const formatCurrency = (amount: number) => {
  return 'Q. ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })
}

export const QuotePDF = ({ invoice, selectedAddons }: { invoice: Invoice, selectedAddons: string[] }) => {
  const selectedAddonsSet = new Set(selectedAddons)

  // Calculate base total from all item base prices
  const baseTotal = invoice.items.reduce((acc, item) => acc + Number(item.base_price), 0)
  
  // Calculate extra cost from selected addons
  let addonsTotal = 0
  invoice.items.forEach(item => {
    item.addons.forEach(addon => {
      if (selectedAddonsSet.has(addon.id)) {
        addonsTotal += Number(addon.price)
      }
    })
  })

  const grandTotal = baseTotal + addonsTotal

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://velum.com.gt'

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          {/* using absolute url as required by react-pdf in browser */}
          <Image src={`${originUrl}/assets/logos/long_logo.png`} style={styles.logo} />
          <View style={styles.titleArea}>
            <Text style={styles.title}>Cotización</Text>
            <Text style={styles.subtitle}>Propuesta a la Medida</Text>
          </View>
        </View>

        {/* Client Info Block */}
        <View style={styles.clientInfoBox}>
          <View>
            <Text style={styles.clientLabel}>Preparado para</Text>
            <Text style={styles.clientValue}>{invoice.client_name}</Text>
          </View>
          <View>
            <Text style={styles.clientLabel}>Referencia</Text>
            <Text style={styles.clientValue}>#{invoice.reference_code}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.clientLabel}>Fecha de Validez</Text>
            <Text style={styles.clientValue}>{formatDate(invoice.valid_until)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Detalles de los Productos</Text>

        {/* Items */}
        {invoice.items.map((item, index) => {
          // Filter selected addons specifically for this item
          const itemSelectedAddons = item.addons.filter(a => selectedAddonsSet.has(a.id))

          return (
            <View style={styles.itemRow} key={item.id} wrap={false}>
              {/* Product Image */}
              {item.image_url ? (
                <Image src={item.image_url} style={styles.itemImage} />
              ) : (
                <View style={styles.itemImage}></View>
              )}

              {/* Product Details */}
              <View style={styles.itemContent}>
                <View style={styles.itemHeader}>
                  <View>
                    <Text style={styles.itemRoom}>Habitación: {item.room_name}</Text>
                    <Text style={styles.itemName}>{item.product_name}</Text>
                  </View>
                  <Text style={styles.itemPrice}>{formatCurrency(item.base_price)}</Text>
                </View>

                <View style={styles.specsRow}>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>Ancho</Text>
                    <Text style={styles.specValue}>{item.width}m</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>Alto</Text>
                    <Text style={styles.specValue}>{item.height}m</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>Tela</Text>
                    <Text style={styles.specValue}>{item.fabric_name}</Text>
                  </View>
                </View>

                {/* Selected Addons */}
                {itemSelectedAddons.length > 0 && (
                  <View style={styles.addonsContainer}>
                    <Text style={styles.specLabel}>Opciones de Mejora (Incluidas)</Text>
                    {itemSelectedAddons.map((addon) => (
                      <View style={styles.addonRow} key={addon.id}>
                        <Text style={styles.addonName}>{addon.addon_name}</Text>
                        <Text style={styles.addonPrice}>+ {formatCurrency(addon.price)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )
        })}

        {/* Grand Total */}
        <View style={styles.totalSection} wrap={false}>
          <Text style={styles.totalLabel}>Total Inversión</Text>
          <Text style={styles.totalValue}>{formatCurrency(grandTotal)}</Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Velum Cortinas y Persianas • www.velum.com.gt • Documento generado automáticamente
        </Text>
      </Page>
    </Document>
  )
}
