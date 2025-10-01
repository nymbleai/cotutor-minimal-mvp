# 📝 Office.js KeyLogger MVP

A minimal Next.js application that demonstrates keystroke tracking in Microsoft Word documents using Office.js.

## ✨ Features

- ✅ **Real-time Keystroke Tracking** - Polls document every 1 second to detect changes
- ✅ **Change Detection** - Tracks additions, deletions, and modifications
- ✅ **Typing Speed Metrics** - Calculates characters per second (CPS)
- ✅ **Live Statistics** - Shows total changes, avg/max CPS, and more
- ✅ **Recent Changes Log** - Displays last 10 document changes with details
- ✅ **Auto-start Logging** - Automatically starts when Word context is detected

## 🏗️ Architecture

```
src/
├── services/
│   └── keylogger.ts          # Core keylogging service (polling-based)
├── hooks/
│   └── useOfficeJs.ts        # React hook for Office.js + keylogging
├── types/
│   └── office.d.ts           # TypeScript declarations for Office.js
└── app/
    ├── layout.tsx            # Loads Office.js script
    ├── page.tsx              # Main UI with controls and stats
    └── page.module.css       # Styling
```

## 🚀 Getting Started

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Note:** To see keylogging in action, you need to load this as a Word Add-in (see below).

### Testing in Microsoft Word

This app needs to run inside Microsoft Word to access document content. You have two options:

#### Option 1: Word Online (Easiest for Development)

1. Create a manifest file (`manifest.xml`) - see example below
2. Upload to Office 365 and sideload in Word Online
3. The add-in will appear in Word's task pane

#### Option 2: Word Desktop

1. Create a manifest file
2. Sideload using Office Add-in CLI or manual file copying
3. Open Word and load the add-in

### Example Manifest File

Create `manifest.xml` in the project root:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<OfficeApp xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xmlns:bt="http://schemas.microsoft.com/office/officeappbasictypes/1.0"
           xmlns:ov="http://schemas.microsoft.com/office/taskpaneappversionoverrides"
           xsi:type="TaskPaneApp">
  <Id>12345678-1234-1234-1234-123456789012</Id>
  <Version>1.0.0.0</Version>
  <ProviderName>Your Name</ProviderName>
  <DefaultLocale>en-US</DefaultLocale>
  <DisplayName DefaultValue="KeyLogger MVP"/>
  <Description DefaultValue="Minimal keystroke tracking for Word"/>
  <IconUrl DefaultValue="https://localhost:3000/logo.png"/>
  <HighResolutionIconUrl DefaultValue="https://localhost:3000/logo.png"/>
  <SupportUrl DefaultValue="https://localhost:3000"/>
  <AppDomains>
    <AppDomain>https://localhost:3000</AppDomain>
  </AppDomains>
  <Hosts>
    <Host Name="Document"/>
  </Hosts>
  <DefaultSettings>
    <SourceLocation DefaultValue="https://localhost:3000"/>
  </DefaultSettings>
  <Permissions>ReadWriteDocument</Permissions>
  <VersionOverrides xmlns="http://schemas.microsoft.com/office/taskpaneappversionoverrides" xsi:type="VersionOverridesV1_0">
    <Hosts>
      <Host xsi:type="Document">
        <DesktopFormFactor>
          <GetStarted>
            <Title resid="GetStarted.Title"/>
            <Description resid="GetStarted.Description"/>
            <LearnMoreUrl resid="GetStarted.LearnMoreUrl"/>
          </GetStarted>
          <FunctionFile resid="Commands.Url"/>
          <ExtensionPoint xsi:type="PrimaryCommandSurface">
            <OfficeTab id="TabHome">
              <Group id="CommandsGroup">
                <Label resid="CommandsGroup.Label"/>
                <Icon>
                  <bt:Image size="16" resid="Icon.16x16"/>
                  <bt:Image size="32" resid="Icon.32x32"/>
                  <bt:Image size="80" resid="Icon.80x80"/>
                </Icon>
                <Control xsi:type="Button" id="TaskpaneButton">
                  <Label resid="TaskpaneButton.Label"/>
                  <Supertip>
                    <Title resid="TaskpaneButton.Label"/>
                    <Description resid="TaskpaneButton.Tooltip"/>
                  </Supertip>
                  <Icon>
                    <bt:Image size="16" resid="Icon.16x16"/>
                    <bt:Image size="32" resid="Icon.32x32"/>
                    <bt:Image size="80" resid="Icon.80x80"/>
                  </Icon>
                  <Action xsi:type="ShowTaskpane">
                    <TaskpaneId>ButtonId1</TaskpaneId>
                    <SourceLocation resid="Taskpane.Url"/>
                  </Action>
                </Control>
              </Group>
            </OfficeTab>
          </ExtensionPoint>
        </DesktopFormFactor>
      </Host>
    </Hosts>
    <Resources>
      <bt:Images>
        <bt:Image id="Icon.16x16" DefaultValue="https://localhost:3000/logo.png"/>
        <bt:Image id="Icon.32x32" DefaultValue="https://localhost:3000/logo.png"/>
        <bt:Image id="Icon.80x80" DefaultValue="https://localhost:3000/logo.png"/>
      </bt:Images>
      <bt:Urls>
        <bt:Url id="GetStarted.LearnMoreUrl" DefaultValue="https://localhost:3000"/>
        <bt:Url id="Commands.Url" DefaultValue="https://localhost:3000"/>
        <bt:Url id="Taskpane.Url" DefaultValue="https://localhost:3000"/>
      </bt:Urls>
      <bt:ShortStrings>
        <bt:String id="GetStarted.Title" DefaultValue="KeyLogger MVP"/>
        <bt:String id="CommandsGroup.Label" DefaultValue="KeyLogger"/>
        <bt:String id="TaskpaneButton.Label" DefaultValue="Show KeyLogger"/>
      </bt:ShortStrings>
      <bt:LongStrings>
        <bt:String id="GetStarted.Description" DefaultValue="Track keystrokes in Word"/>
        <bt:String id="TaskpaneButton.Tooltip" DefaultValue="Click to open KeyLogger"/>
      </bt:LongStrings>
    </Resources>
  </VersionOverrides>
</OfficeApp>
```

## 📊 How It Works

### 1. **Keylogging Service** (`keylogger.ts`)

- Singleton class that manages document polling
- Polls every 1 second using Office.js API
- Compares current document text with previous snapshot
- Calculates change type, position, length, and typing speed
- Stores last 50 changes in memory

### 2. **Office.js Hook** (`useOfficeJs.ts`)

- React hook that wraps the keylogger service
- Detects Office.js availability and Word context
- Provides start/stop logging controls
- Auto-updates changes every 2 seconds
- Returns statistics and change history

### 3. **UI Components** (`page.tsx`)

- Status indicator (Office.js ready/not ready)
- Logging controls (Start/Stop/Clear)
- Live statistics dashboard
- Recent changes list with details
- Auto-starts logging when Word is detected

## 🎯 Key Logging Data Structure

Each change captures:

```typescript
interface DocumentChange {
  timestamp: Date // When the change occurred
  previousText: string // Document text before change
  currentText: string // Document text after change
  changeType: 'addition' | 'deletion' | 'modification'
  changeLength: number // Number of characters changed
  changePosition: number // Position in document where change occurred
  cps: number // Characters per second (typing speed)
}
```

## 📈 Statistics Tracked

- **Total Changes** - Number of document modifications
- **Additions** - Number of text additions
- **Deletions** - Number of text deletions
- **Modifications** - Number of text modifications
- **Average CPS** - Average typing speed across all changes
- **Max CPS** - Peak typing speed
- **Current CPS** - Most recent typing speed
- **Total Characters** - Total characters changed

## 🔧 Configuration

### Polling Interval

Change the polling frequency in `keylogger.ts`:

```typescript
private readonly MIN_POLLING_INTERVAL = 1000; // milliseconds
```

### Max Changes Stored

Adjust how many changes are kept in memory:

```typescript
private readonly MAX_CHANGES = 50; // number of changes
```

## 🚫 Limitations

1. **Polling-based, not event-based** - Changes are detected every 1 second, not in real-time
2. **Full document comparison** - Compares entire document text on each poll
3. **Memory-only storage** - Changes are not persisted (cleared on refresh)
4. **Requires Word context** - Only works when loaded as a Word Add-in
5. **No backend integration** - Data stays in the frontend (can be added)

## 🔮 Future Enhancements

- [ ] Backend API to store keystroke logs
- [ ] Periodic upload of changes to server
- [ ] Real-time event-based tracking (if Office.js adds support)
- [ ] Document snapshot history
- [ ] Export changes as JSON/CSV
- [ ] Configurable polling interval from UI
- [ ] Multiple document support

## 📚 Resources

- [Office.js Documentation](https://docs.microsoft.com/office/dev/add-ins/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Sideload Office Add-ins](https://docs.microsoft.com/office/dev/add-ins/testing/test-debug-office-add-ins)

## 🤝 Contributing

This is a minimal MVP for demonstration purposes. Feel free to:

- Add backend integration
- Improve the UI
- Add more statistics
- Enhance the keylogging algorithm

## 📄 License

MIT

---

**Built with ❤️ using Next.js 15 and Office.js**
