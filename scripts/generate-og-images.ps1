Add-Type -AssemblyName System.Drawing

function New-Brush([string]$hex) {
  return [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($hex))
}

function New-LinePen([string]$hex, [float]$width) {
  return [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml($hex), $width)
}

function New-TextFont([float]$size, [System.Drawing.FontStyle]$style) {
  return [System.Drawing.Font]::new('Arial', $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
}

function New-RoundedPath([int]$x, [int]$y, [int]$w, [int]$h, [int]$r) {
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function Save-OgImage(
  [string]$path,
  [string]$accent,
  [string]$accent2,
  [string]$label,
  [string]$title,
  [string]$subtitle,
  [string]$rightTitle,
  [string]$rightSub
) {
  $bmp = [System.Drawing.Bitmap]::new(1200, 630)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $rect = [System.Drawing.Rectangle]::new(0, 0, 1200, 630)
  $bg = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $rect,
    [System.Drawing.ColorTranslator]::FromHtml('#020818'),
    [System.Drawing.ColorTranslator]::FromHtml('#101b3f'),
    25
  )
  $g.FillRectangle($bg, $rect)

  $a = [System.Drawing.ColorTranslator]::FromHtml($accent)
  $a2 = [System.Drawing.ColorTranslator]::FromHtml($accent2)
  $g.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(72, $a)), 820, -120, 520, 520)
  $g.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(58, $a2)), -160, 320, 430, 430)

  $panel = New-RoundedPath 58 58 1084 514 28
  $g.FillPath((New-Brush '#07162b'), $panel)
  $g.DrawPath((New-LinePen $accent 3), $panel)

  $badge = New-RoundedPath 92 92 390 58 29
  $g.FillPath([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(42, $a)), $badge)
  $g.DrawPath((New-LinePen $accent 2), $badge)
  $g.DrawString($label, (New-TextFont 28 ([System.Drawing.FontStyle]::Bold)), (New-Brush '#e0f2fe'), 126, 106)

  $g.DrawString('MY REAL ID', (New-TextFont 82 ([System.Drawing.FontStyle]::Bold)), (New-Brush '#ffffff'), 90, 172)
  $g.DrawString($title, (New-TextFont 42 ([System.Drawing.FontStyle]::Bold)), (New-Brush $accent), 94, 282)
  $g.DrawString($subtitle, (New-TextFont 30 ([System.Drawing.FontStyle]::Regular)), (New-Brush '#cbd5e1'), 96, 344)
  $g.DrawString('2026.07.26 - 07.28  |  MY REAL ID Retreat', (New-TextFont 25 ([System.Drawing.FontStyle]::Regular)), (New-Brush '#93c5fd'), 96, 488)

  $cardRect = [System.Drawing.Rectangle]::new(760, 136, 340, 310)
  $card = New-RoundedPath $cardRect.X $cardRect.Y $cardRect.Width $cardRect.Height 30
  $cardBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $cardRect,
    [System.Drawing.ColorTranslator]::FromHtml('#0f766e'),
    [System.Drawing.ColorTranslator]::FromHtml('#1d4ed8'),
    45
  )
  $g.FillPath($cardBrush, $card)
  $g.DrawPath((New-LinePen $accent 3), $card)
  $g.DrawString($rightTitle, (New-TextFont 54 ([System.Drawing.FontStyle]::Bold)), (New-Brush '#ffffff'), $cardRect.X + 42, $cardRect.Y + 82)
  $g.DrawString($rightSub, (New-TextFont 34 ([System.Drawing.FontStyle]::Bold)), (New-Brush '#bae6fd'), $cardRect.X + 48, $cardRect.Y + 178)
  $g.FillRectangle((New-Brush $accent2), $cardRect.X + 50, $cardRect.Y + 248, $cardRect.Width - 100, 12)

  $bmp.Save((Join-Path (Get-Location) $path), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

Save-OgImage 'public\og-apply.png' '#22d3ee' '#10b981' 'PARTICIPANT LINK' 'APPLICATION FORM' 'Share this link with applicants' 'APPLY' 'FORM'
Save-OgImage 'public\og-system.png' '#60a5fa' '#8b5cf6' 'STAFF LINK' 'OPERATIONS SYSTEM' 'Staff-only retreat dashboard' 'STAFF' 'SYSTEM'

Get-Item public\og-apply.png, public\og-system.png | Select-Object Name, Length, LastWriteTime
