$ErrorActionPreference = 'SilentlyContinue'

$stdin = [Console]::In.ReadToEnd()
$payload = $null
try { $payload = $stdin | ConvertFrom-Json } catch {}

$titleText = "Claude Code"
$bodyText  = "Claude has responded."
$isNotification = $payload -and $payload.hook_event_name -eq "Notification"
$displaySeconds = 5

$configFile = Join-Path $PSScriptRoot "notification-config.json"
if (Test-Path $configFile) {
    try {
        $config = Get-Content $configFile -Raw | ConvertFrom-Json
        $seconds = [double]$config.durationSeconds
        if ($seconds -gt 0) { $displaySeconds = $seconds }
    } catch {}
}

if ($isNotification) {
    $msg = "$($payload.message)"
    if ($msg -match 'permission|tool use|approval') {
        $bodyText = "Claude needs permission to continue"
    } elseif ($msg) {
        $bodyText = $msg
    } else {
        $bodyText = "Claude is waiting for your input"
    }
}

if ($payload -and $payload.transcript_path -and (Test-Path $payload.transcript_path)) {
    try {
        $msgs = Get-Content $payload.transcript_path |
            ForEach-Object { try { $_ | ConvertFrom-Json } catch { $null } } |
            Where-Object { $_ -and $_.role }

        $firstUser = $msgs | Where-Object { $_.role -eq "user" } | Select-Object -First 1
        if ($firstUser) {
            $raw = if ($firstUser.content -is [array]) {
                ($firstUser.content | Where-Object { $_.type -eq "text" } | Select-Object -First 1).text
            } else { "$($firstUser.content)" }
            if ($raw -and $raw.Trim().Length -gt 0) {
                $t = $raw.Trim()
                $titleText = $t.Substring(0, [Math]::Min(55, $t.Length))
                if ($t.Length -gt 55) { $titleText += "..." }
            }
        }

        if (-not $isNotification) {
            $lastAssist = $msgs | Where-Object { $_.role -eq "assistant" } | Select-Object -Last 1
            if ($lastAssist) {
                $raw = if ($lastAssist.content -is [array]) {
                    ($lastAssist.content | Where-Object { $_.type -eq "text" } | Select-Object -Last 1).text
                } else { "$($lastAssist.content)" }
                if ($raw -and $raw.Trim().Length -gt 0) {
                    $t = $raw.Trim()
                    $bodyText = $t.Substring(0, [Math]::Min(160, $t.Length))
                    if ($t.Length -gt 160) { $bodyText += "..." }
                }
            }
        }
    } catch {}
}

Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

$rs = [System.Management.Automation.Runspaces.RunspaceFactory]::CreateRunspace()
$rs.ApartmentState = [System.Threading.ApartmentState]::STA
$rs.ThreadOptions  = [System.Management.Automation.Runspaces.PSThreadOptions]::ReuseThread
$rs.Open()
$rs.SessionStateProxy.SetVariable('titleText', $titleText)
$rs.SessionStateProxy.SetVariable('bodyText',  $bodyText)
$rs.SessionStateProxy.SetVariable('displaySeconds', $displaySeconds)

$ps = [System.Management.Automation.PowerShell]::Create()
$ps.Runspace = $rs
[void]$ps.AddScript({
    $xaml = @'
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        WindowStyle="None" AllowsTransparency="True" Background="Transparent"
        Topmost="True" ShowInTaskbar="False" ShowActivated="False"
        Width="390" Height="115" ResizeMode="NoResize">
  <Border CornerRadius="12" Margin="6">
    <Border.Background>
      <LinearGradientBrush StartPoint="0,0" EndPoint="1,1">
        <GradientStop Color="#2A1510" Offset="0"/>
        <GradientStop Color="#1E0E08" Offset="0.5"/>
        <GradientStop Color="#120804" Offset="1"/>
      </LinearGradientBrush>
    </Border.Background>
    <Border.BorderBrush>
      <LinearGradientBrush StartPoint="0,0" EndPoint="1,0">
        <GradientStop Color="#E8845A" Offset="0"/>
        <GradientStop Color="#C05030" Offset="1"/>
      </LinearGradientBrush>
    </Border.BorderBrush>
    <Border.BorderThickness>1.5</Border.BorderThickness>
    <Border.Effect>
      <DropShadowEffect BlurRadius="20" ShadowDepth="2" Direction="270" Opacity="0.5" Color="#D06B47"/>
    </Border.Effect>
    <Grid>
      <Grid Margin="18,10,18,10">
        <Grid.ColumnDefinitions>
          <ColumnDefinition Width="56"/>
          <ColumnDefinition Width="*"/>
        </Grid.ColumnDefinitions>

        <Border Grid.Column="0" Width="48" Height="48" CornerRadius="10"
                HorizontalAlignment="Center" VerticalAlignment="Center">
          <Border.Background>
            <LinearGradientBrush StartPoint="0,0" EndPoint="1,1">
              <GradientStop Color="#E8845A" Offset="0"/>
              <GradientStop Color="#C05030" Offset="1"/>
            </LinearGradientBrush>
          </Border.Background>
          <TextBlock Text="C" FontSize="24" FontWeight="Bold" Foreground="#FFFFFF"
                     FontFamily="Segoe UI" HorizontalAlignment="Center" VerticalAlignment="Center"/>
        </Border>

        <StackPanel Grid.Column="1" Margin="14,0,0,0" VerticalAlignment="Center">
          <TextBlock Name="TitleBlock" FontWeight="Bold" Foreground="#E8845A"
                     FontSize="18" FontFamily="Segoe UI"
                     TextTrimming="CharacterEllipsis"/>
          <TextBlock Name="MsgBlock" Foreground="#B0B8CC" FontSize="15"
                     FontFamily="Segoe UI" TextWrapping="Wrap"
                     MaxHeight="44" TextTrimming="CharacterEllipsis"
                     Margin="0,5,0,0"/>
        </StackPanel>
      </Grid>

      <Button Name="CloseBtn" Panel.ZIndex="1" Content="&#x2715;"
              HorizontalAlignment="Right" VerticalAlignment="Top"
              Margin="0,6,8,0" Width="26" Height="26"
              Background="Transparent" Foreground="#A08070" BorderThickness="0"
              FontSize="14" FontFamily="Segoe UI" FontWeight="Bold"
              Cursor="Hand" Opacity="0.7">
        <Button.Template>
          <ControlTemplate TargetType="Button">
            <Border Background="Transparent" CornerRadius="4">
              <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
            </Border>
          </ControlTemplate>
        </Button.Template>
      </Button>
    </Grid>
  </Border>
</Window>
'@

    $reader = [System.Xml.XmlNodeReader]::new([xml]$xaml)
    $win = [System.Windows.Markup.XamlReader]::Load($reader)

    $win.FindName("TitleBlock").Text = $titleText
    $win.FindName("MsgBlock").Text   = $bodyText
    $win.FindName("CloseBtn").Add_Click({ $win.Close() })

    $area = [System.Windows.SystemParameters]::WorkArea
    $win.Left = 16
    $win.Top  = $area.Bottom - $win.Height - 16

    $win.Add_Loaded({
        $fadeIn = [System.Windows.Media.Animation.DoubleAnimation]::new()
        $fadeIn.From     = 0
        $fadeIn.To       = 1
        $fadeIn.Duration = [System.Windows.Duration]::new([TimeSpan]::FromMilliseconds(250))
        $win.BeginAnimation([System.Windows.Window]::OpacityProperty, $fadeIn)

        $t = [System.Windows.Threading.DispatcherTimer]::new()
        $t.Interval = [TimeSpan]::FromSeconds($displaySeconds)
        $t.Add_Tick({
            $fadeOut = [System.Windows.Media.Animation.DoubleAnimation]::new()
            $fadeOut.From     = 1
            $fadeOut.To       = 0
            $fadeOut.Duration = [System.Windows.Duration]::new([TimeSpan]::FromMilliseconds(250))
            $fadeOut.Add_Completed({ $win.Close() })
            $win.BeginAnimation([System.Windows.Window]::OpacityProperty, $fadeOut)
            $t.Stop()
        })
        $t.Start()
    })

    [void]$win.ShowDialog()
})

$ps.Invoke()
$rs.Close()
