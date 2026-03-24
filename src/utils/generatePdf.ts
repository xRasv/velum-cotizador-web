import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * Converts modern CSS color functions (lab, lch, oklch, oklab) to standard
 * rgb values by reading the browser's computed style. This is needed because
 * html2canvas cannot parse lab() / oklch() colors used by Tailwind v4.
 */
function convertModernColors(clonedDoc: Document) {
  const allElements = clonedDoc.querySelectorAll('*')
  const colorProps = [
    'color', 'background-color', 'border-color',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'outline-color', 'text-decoration-color', 'box-shadow', 'fill', 'stroke'
  ]
  const modernColorRegex = /\b(lab|lch|oklch|oklab)\(/i

  allElements.forEach(el => {
    const htmlEl = el as HTMLElement
    const computed = clonedDoc.defaultView?.getComputedStyle(htmlEl)
    if (!computed) return

    colorProps.forEach(prop => {
      const value = computed.getPropertyValue(prop)
      if (value && modernColorRegex.test(value)) {
        // The browser already has the resolved RGB value in computedStyle
        // for standard properties, but html2canvas reads from inline/stylesheet.
        // Force override with the computed value which is always in rgb() format.
        htmlEl.style.setProperty(prop, value, 'important')
      }
    })
  })

  // Also strip CSS custom properties that may contain lab() values from stylesheets
  const sheets = clonedDoc.styleSheets
  for (let i = 0; i < sheets.length; i++) {
    try {
      const rules = sheets[i].cssRules
      for (let j = rules.length - 1; j >= 0; j--) {
        const rule = rules[j] as CSSStyleRule
        if (rule.cssText && modernColorRegex.test(rule.cssText)) {
          // Remove problematic rules — the inline styles above will take over
          sheets[i].deleteRule(j)
        }
      }
    } catch {
      // Cross-origin stylesheets will throw — skip them
    }
  }
}

/**
 * Captures the given DOM element and generates a multi-page PDF download.
 * Optimised for mobile: uses 1.5× scale (crisp but memory-friendly).
 * On iOS Safari, opens the PDF in a new tab since direct downloads are blocked.
 */
export async function generatePdf(
  element: HTMLElement,
  filename: string = 'Cotizacion.pdf'
) {
  // 1. Temporarily hide non-printable UI (floating bar, etc.)
  const hiddenEls = document.querySelectorAll<HTMLElement>('[data-no-pdf]')
  hiddenEls.forEach(el => (el.style.display = 'none'))

  // 2. Scroll to top so everything renders from the beginning
  window.scrollTo(0, 0)

  // Brief delay to let the scroll + DOM settle
  await new Promise(r => setTimeout(r, 300))

  // 3. Capture the element to a high-quality canvas
  const canvas = await html2canvas(element, {
    scale: 1.5,            // good crispness without killing mobile RAM
    useCORS: true,         // allow cross-origin images
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: 900,      // force a consistent "tablet-like" width for layout
    onclone: (_doc, clonedEl) => {
      // Convert lab()/oklch() colors to rgb so html2canvas can parse them
      convertModernColors(clonedEl.ownerDocument)
    }
  })

  // 4. Create the PDF — letter size in mm
  const pageWidth = 215.9  // Letter width in mm
  const pageHeight = 279.4 // Letter height in mm
  const pdf = new jsPDF('p', 'mm', 'letter')

  // Calculate dimensions: fit canvas width to page width with margins
  const margin = 5
  const usableWidth = pageWidth - margin * 2
  const imgWidth = usableWidth
  const imgHeight = (canvas.height * usableWidth) / canvas.width
  const usableHeight = pageHeight - margin * 2

  // 5. Slice the canvas into pages
  let yOffset = 0
  let pageIndex = 0

  while (yOffset < imgHeight) {
    if (pageIndex > 0) {
      pdf.addPage()
    }

    // Calculate source coordinates on the canvas for this page
    const sourceY = (yOffset / imgHeight) * canvas.height
    const sourceH = Math.min(
      (usableHeight / imgHeight) * canvas.height,
      canvas.height - sourceY
    )
    const destH = Math.min(usableHeight, imgHeight - yOffset)

    // Create a temporary canvas for this page slice
    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = sourceH
    const ctx = pageCanvas.getContext('2d')!
    ctx.drawImage(
      canvas,
      0, sourceY,               // source x, y
      canvas.width, sourceH,    // source w, h
      0, 0,                     // dest x, y
      canvas.width, sourceH     // dest w, h
    )

    const pageData = pageCanvas.toDataURL('image/jpeg', 0.92)
    pdf.addImage(pageData, 'JPEG', margin, margin, imgWidth, destH)

    yOffset += usableHeight
    pageIndex++
  }

  // 6. Download or open based on platform
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  if (isIOS) {
    // iOS Safari blocks blob downloads — open in a new tab instead
    const blobUrl = pdf.output('bloburl') as unknown as string
    window.open(blobUrl, '_blank')
  } else {
    pdf.save(filename)
  }

  // 7. Restore hidden elements
  hiddenEls.forEach(el => (el.style.display = ''))
}
