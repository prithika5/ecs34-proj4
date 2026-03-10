# CXMLReader

## Description
CXMLReader reads XML data from a CDataSource and turns it into a list of SXMLEntity
objects. Each SXMLEntity represents a small part of the XML, such as an opening
tag, a closing tag, or some text. The entities are read one at a time in the order
they appear in the XML.

## Public Functions

### CXMLReader(std::shared_ptr<CDataSource> src)
Creates a reader using the given data source.

- Reads all XML data from the source
- If the source is null, the reader produces no entities

### ~CXMLReader()
Destructor

### bool End() const
Checks if all XML entities have been read.

Returns true when there are no more entities left to read.

### bool ReadEntity(SXMLEntity &entity, bool skipcdata)
Gets the next XML entity from the reader.

Parameters
- entity: output parameter that receives the next entity
- skipcdata: when true, text between tags is skipped

Returns
- true if an entity was read
- false if there are no more entities

Notes
- Text includes whitespace and characters between tags
- Extra wrapper elements used internally are not returned

## Example Usage

```cpp
std::shared_ptr<CDataSource> src =
    std::make_shared<CStringDataSource>(
        <student id=1>
            <name>Alice</name>
            <age>20</age>
        </student>
    );

CXMLReader reader(src);

SXMLEntity entity;

while (reader.ReadEntity(entity, false)) {

    if (entity.DType == SXMLEntity::EType::StartElement) {
        
    }
    else if (entity.DType == SXMLEntity::EType::EndElement) {
        
    }
    else if (entity.DType == SXMLEntity::EType::CompleteElement) {
       
    }
    else if (entity.DType == SXMLEntity::EType::CharData) {
        
    }
}
