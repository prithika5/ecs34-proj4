#include "DSVReader.h"
#include "StringUtils.h"

struct CDSVReader::SImplementation{
    std::shared_ptr<CDataSource> Src;
    char Delim;

    SImplementation(std::shared_ptr<CDataSource> s, char d){
        Src = s;
        Delim = d;
    }
};

CDSVReader::CDSVReader(std::shared_ptr<CDataSource> src, char delimiter){
    DImplementation = std::make_unique<SImplementation>(src, delimiter);
}

CDSVReader::~CDSVReader(){

}

bool CDSVReader::End() const{
    return DImplementation->Src->End();
}

bool CDSVReader::ReadRow(std::vector<std::string> &row){
    row.clear();

    if(DImplementation->Src->End()){
        return false;
    }

    std::string line = "";
    char c;

    while(!DImplementation->Src->End()){
        if(!DImplementation->Src->Get(c)){
            break;
        }

        if(c == '\n'){
            break;
        }

        if(c != '\r'){
            line += c;
        }
    }

    row = StringUtils::Split(line, std::string(1, DImplementation->Delim));
    return true;
}