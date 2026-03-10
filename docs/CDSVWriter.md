# CDSVWriter

## Description
CDSVWriter is used to write data in DSV format to a CDataSink. Each row is written as a delimited line followed by a newline character.

### WriteRow(row)
Writes one row to the output.Each field in row is separated by the delimiter.A newline is added after the row. Returns true if the row was written successfully.

## Example
auto sink = std::make_shared();

CDSVWriter w(sink, ',');

w.WriteRow({"A","B"}); w.WriteRow({"1","2"});