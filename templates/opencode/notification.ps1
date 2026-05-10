$ErrorActionPreference = 'SilentlyContinue'

Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

$titleText = "OPENCODE"
$bodyText  = "opencode complete response"
$attributionText = "AI coding agent"
$displaySeconds = 5

$configFile = Join-Path $PSScriptRoot "notification-config.json"
if (Test-Path $configFile) {
    try {
        $config = Get-Content $configFile -Raw | ConvertFrom-Json
        $seconds = [double]$config.durationSeconds
        if ($seconds -gt 0) { $displaySeconds = $seconds }
    } catch {}
}

$notifyFile = Join-Path $env:TEMP "opencode-notify.json"
if (Test-Path $notifyFile) {
    try {
        $data = Get-Content $notifyFile -Raw | ConvertFrom-Json
        Remove-Item $notifyFile -Force
        if ($data.type -eq "question") {
            $bodyText = if ($data.body) { $data.body } else { "OpenCode is waiting for your input" }
            $attributionText = "Waiting for your input"
        } elseif ($data.type -eq "permission") {
            $bodyText = "OpenCode needs permission to continue"
            $attributionText = "Requires approval"
        }
    } catch {}
}

$rs = [System.Management.Automation.Runspaces.RunspaceFactory]::CreateRunspace()
$rs.ApartmentState = [System.Threading.ApartmentState]::STA
$rs.ThreadOptions  = [System.Management.Automation.Runspaces.PSThreadOptions]::ReuseThread
$rs.Open()
$rs.SessionStateProxy.SetVariable('titleText', $titleText)
$rs.SessionStateProxy.SetVariable('bodyText', $bodyText)
$rs.SessionStateProxy.SetVariable('attributionText', $attributionText)
$rs.SessionStateProxy.SetVariable('displaySeconds', $displaySeconds)

$ps = [System.Management.Automation.PowerShell]::Create()
$ps.Runspace = $rs
[void]$ps.AddScript({
    $xaml = @'
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        WindowStyle="None" AllowsTransparency="True" Background="Transparent"
        Topmost="True" ShowInTaskbar="False" ShowActivated="False"
        Width="360" Height="110" ResizeMode="NoResize">
  <Border CornerRadius="10" Margin="4">
    <Border.Background>
      <LinearGradientBrush StartPoint="0,0" EndPoint="1,1">
        <GradientStop Color="#1E1338" Offset="0"/>
        <GradientStop Color="#2D1B69" Offset="0.5"/>
        <GradientStop Color="#1A0F30" Offset="1"/>
      </LinearGradientBrush>
    </Border.Background>
    <Border.BorderBrush>
      <LinearGradientBrush StartPoint="0,0" EndPoint="1,0">
        <GradientStop Color="#a87cfe" Offset="0"/>
        <GradientStop Color="#7B5EA7" Offset="1"/>
      </LinearGradientBrush>
    </Border.BorderBrush>
    <Border.BorderThickness>1.5</Border.BorderThickness>
    <Border.Effect>
      <DropShadowEffect BlurRadius="20" ShadowDepth="2" Direction="270" Opacity="0.5" Color="#a87cfe"/>
    </Border.Effect>
    <Grid Margin="0">
      <Button Name="CloseBtn" Content="&#x2715;"
              HorizontalAlignment="Right" VerticalAlignment="Top"
              Margin="0,4,6,0" Width="22" Height="22"
              Background="Transparent" Foreground="#C8B8E8" BorderThickness="0"
              FontSize="12" FontFamily="Segoe UI" FontWeight="Bold"
              Cursor="Hand" Opacity="0.7" Panel.ZIndex="10">
        <Button.Template>
          <ControlTemplate TargetType="Button">
            <Border Background="Transparent" CornerRadius="4">
              <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
            </Border>
          </ControlTemplate>
        </Button.Template>
      </Button>

      <Grid Margin="12,6,10,6" VerticalAlignment="Center">
        <Grid.ColumnDefinitions>
          <ColumnDefinition Width="46"/>
          <ColumnDefinition Width="*"/>
        </Grid.ColumnDefinitions>

      <Border Grid.Column="0" Width="40" Height="40" CornerRadius="8"
              HorizontalAlignment="Center" VerticalAlignment="Center">
        <Border.Background>
          <SolidColorBrush Color="#a87cfe"/>
        </Border.Background>
        <TextBlock Text="OC" FontSize="20" FontWeight="Bold" Foreground="#FFFFFF"
                   FontFamily="Segoe UI" HorizontalAlignment="Center" VerticalAlignment="Center"/>
      </Border>

      <StackPanel Grid.Column="1" Margin="10,0,28,0" VerticalAlignment="Center">
        <TextBlock Name="TitleBlock" FontWeight="Bold" Foreground="#a87cfe"
                   FontSize="15" FontFamily="Segoe UI"
                   TextTrimming="CharacterEllipsis"/>
        <TextBlock Name="MsgBlock" Foreground="#E8E0F5" FontSize="13"
                   FontFamily="Segoe UI" TextWrapping="NoWrap"
                   TextTrimming="CharacterEllipsis"
                   Margin="0,2,0,0"/>
        <TextBlock Name="AttrBlock" Foreground="#8B7AAD" FontSize="10.5"
                   FontFamily="Segoe UI" Margin="0,2,0,0"
                   Text="AI coding agent"/>
      </StackPanel>
      </Grid>
    </Grid>
  </Border>
</Window>
'@

    $reader = [System.Xml.XmlNodeReader]::new([xml]$xaml)
    $win = [System.Windows.Markup.XamlReader]::Load($reader)

    $win.FindName("TitleBlock").Text = $titleText
    $win.FindName("MsgBlock").Text = $bodyText
    $win.FindName("AttrBlock").Text = $attributionText
    $win.FindName("CloseBtn").Add_Click({ $win.Close() })

    $area = [System.Windows.SystemParameters]::WorkArea
    $win.Left = 16
    $win.Top = $area.Bottom - $win.Height - 16

    $win.Add_Loaded({
        $fadeIn = [System.Windows.Media.Animation.DoubleAnimation]::new()
        $fadeIn.From = 0
        $fadeIn.To = 1
        $fadeIn.Duration = [System.Windows.Duration]::new([TimeSpan]::FromMilliseconds(250))
        $win.BeginAnimation([System.Windows.Window]::OpacityProperty, $fadeIn)

        $t = [System.Windows.Threading.DispatcherTimer]::new()
        $t.Interval = [TimeSpan]::FromSeconds($displaySeconds)
        $t.Add_Tick({
            $fadeOut = [System.Windows.Media.Animation.DoubleAnimation]::new()
            $fadeOut.From = 1
            $fadeOut.To = 0
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
