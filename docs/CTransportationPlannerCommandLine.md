# CTransportationPlannerCommandLine

## Overview

`CTransportationPlannerCommandLine` provides the command-line interface for the `transplanner` program. It reads commands from a `CDataSource`, writes output and errors to `CDataSink` objects, and uses a `CTransportationPlanner` to answer routing requests.

It also supports saving the last computed path to a results file using a `CDataFactory`.

---

## Type Definitions

### `SImplementation`

```cpp
struct SImplementation;
```

Opaque implementation structure that stores command processing state.

---

## Private Members

### `DImplementation`

```cpp
std::unique_ptr<SImplementation> DImplementation;
```

Owns the internal command processor implementation.

---

## Constructors

### `CTransportationPlannerCommandLine(std::shared_ptr<CDataSource> cmdsrc, std::shared_ptr<CDataSink> outsink, std::shared_ptr<CDataSink> errsink, std::shared_ptr<CDataFactory> results, std::shared_ptr<CTransportationPlanner> planner)`

Constructs the command-line wrapper.

```cpp
CTransportationPlannerCommandLine(std::shared_ptr<CDataSource> cmdsrc,
                                  std::shared_ptr<CDataSink> outsink,
                                  std::shared_ptr<CDataSink> errsink,
                                  std::shared_ptr<CDataFactory> results,
                                  std::shared_ptr<CTransportationPlanner> planner);
```

**Parameters:**
- `cmdsrc` — Command input source
- `outsink` — Standard output sink
- `errsink` — Error output sink
- `results` — Factory used to create save files
- `planner` — Planner used to answer commands

---

## Destructors

### `~CTransportationPlannerCommandLine()`

```cpp
~CTransportationPlannerCommandLine();
```

Releases the internal implementation.

---

## Public Member Functions

### `ProcessCommands()`

Processes commands until `exit` or end of input.

```cpp
bool ProcessCommands();
```

**Supported Commands:**
- `help`
- `exit`
- `count`
- `node index`
- `shortest src dest`
- `fastest src dest`
- `save`
- `print`

**Returns:**
- `true` if command processing finished normally
- `false` if the command-line object was not initialized correctly

---

## Example Usage

```cpp
auto cmdsrc = std::make_shared<CStandardDataSource>();
auto outsink = std::make_shared<CStandardDataSink>();
auto errsink = std::make_shared<CStandardErrorDataSink>();
auto results = std::make_shared<CFileDataFactory>("./results");

CTransportationPlannerCommandLine cli(cmdsrc, outsink, errsink, results, planner);
cli.ProcessCommands();
```

---

## Design Notes

- Keeps the last valid path so `print` and `save` can reuse it
- Uses `CDataSource` and `CDataSink` instead of raw streams for easier testing
- Handles invalid commands by printing a help-style error message
