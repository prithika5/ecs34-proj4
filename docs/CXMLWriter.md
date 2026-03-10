# CXMLWriter

## Description
CXMLWriter writes XML data to a CDataSink using SXMLEntity objects. You give the
writer entities one at a time, and it turns them into XML text. The writer keeps
track of which elements are currently open so that end elements are written in
the correct order.

## Public Functions

### CXMLWriter(std::shared_ptr<CDataSink> sink)
Creates a writer using the given data sink.

- If the sink is null, writing fails
- The writer keeps track of open start elements

### ~CXMLWriter()
Destructor

### bool WriteEntity(const SXMLEntity &entity)
Writes one XML entity to the sink.

Returns
- true if the entity was written successfully
- false if the entity is invalid or cannot be written

Notes
- StartElement writes an opening tag and remembers the element name
- EndElement only works if it matches the most recently opened element
- CompleteElement writes a self closing tag
- CharData writes text and escapes special characters

### bool Flush()
Closes any remaining open elements.

Returns
- true after all remaining elements are closed

Notes
- Flush is useful if some end elements were not written
- Flush does not check if the XML structure is correct beyond closing open tags

## Example Usage

```cpp
std::shared_ptr<CDataSink> sink =
    std::make_shared<CStringDataSink>();

CXMLWriter writer(sink);

SXMLEntity startStudent;
startStudent.DType = SXMLEntity::EType::StartElement;
startStudent.DNameData = "student";
startStudent.DAttributes.push_back(std::make_pair("id", "1"));
writer.WriteEntity(startStudent);

SXMLEntity startName;
startName.DType = SXMLEntity::EType::StartElement;
startName.DNameData = "name";
writer.WriteEntity(startName);

SXMLEntity text;
text.DType = SXMLEntity::EType::CharData;
text.DNameData = "Alice";
writer.WriteEntity(text);

SXMLEntity endName;
endName.DType = SXMLEntity::EType::EndElement;
endName.DNameData = "name";
writer.WriteEntity(endName);

SXMLEntity endStudent;
endStudent.DType = SXMLEntity::EType::EndElement;
endStudent.DNameData = "student";
writer.WriteEntity(endStudent);

writer.Flush();
