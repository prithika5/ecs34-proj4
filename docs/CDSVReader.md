# CDSVReader

## Description
CDSVReader is used to read data in DSV format from a 'CDataSource', and parse each row into a string array 'std::vectorstd::string'.

### End()
Returns true if there is no more data.

### ReadRow(row)
Reads one row from the input and stores the result in row. Returns true if a row was read, false if there is no more data.

## Example
auto src = std::make_shared("A,B\n1,2\n");

CDSVReader r(src, ',');

std::vectorstd::string v;

r.ReadRow(v); // v = {"A","B"} r.ReadRow(v); // v = {"1","2"}