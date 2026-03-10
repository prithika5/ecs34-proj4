#include "XMLReader.h"
#include <string>
#include <vector>
#include <expat.h>
#include <unordered_map>

struct CXMLReader::SImplementation{

    std::shared_ptr<CDataSource> source;
    std::string text;
    std::vector<SXMLEntity> entities;
    int index;

    SImplementation(std::shared_ptr<CDataSource> src){

        source = src;
        index = 0;

        if(source){
            char ch;
            while(source->Get(ch)){
                text.push_back(ch);
            }
        }

        std::string cleaned = text;

        if(cleaned.rfind("<?xml",0) == 0){
            size_t endPos = cleaned.find("?>");

            if(endPos != std::string::npos){
                cleaned = cleaned.substr(endPos + 2);
                size_t firstChar = cleaned.find_first_not_of(" \t\n\r");

                if(firstChar != std::string::npos){
                    cleaned = cleaned.substr(firstChar);
                }
            }
        }

        text = cleaned;

        std::string wrapped = "<root>" + cleaned + "</root>";

        XML_Parser parser = XML_ParserCreate(NULL);
        XML_SetUserData(parser,this);
        XML_SetElementHandler(parser,startHandler,endHandler);
        XML_SetCharacterDataHandler(parser,charHandler);
        XML_Parse(parser,wrapped.c_str(),(int)wrapped.size(),1);
        XML_ParserFree(parser);

        fixSelfClosing();
    }

    void fixSelfClosing(){

        std::unordered_map<std::string,int> tagCount;

        for(size_t i=0;i+1<entities.size();){
            if(entities[i].DType != SXMLEntity::EType::StartElement){
                i++;
                continue;
            }

            std::string tagName = entities[i].DNameData;
            int occurrence = tagCount[tagName]++;

            size_t j = i+1;
            while(j<entities.size()){
                if(entities[j].DType == SXMLEntity::EType::EndElement &&
                   entities[j].DNameData == tagName){
                    break;
                }
                j++;
            }

            if(j>=entities.size()){
                i++;
                continue;
            }

            bool onlySpace = true;

            for(size_t k=i+1;k<j;k++){
                if(entities[k].DType != SXMLEntity::EType::CharData){
                    onlySpace = false;
                    break;
                }

                for(char c : entities[k].DNameData){
                    if(c!=' ' && c!='\t' && c!='\n' && c!='\r'){
                        onlySpace = false;
                        break;
                    }
                }

                if(!onlySpace) break;
            }

            if(onlySpace && isSelfClosing(tagName,occurrence)){
                entities[i].DType = SXMLEntity::EType::CompleteElement;
                entities.erase(entities.begin()+i+1,entities.begin()+j+1);
            }
            else{
                i++;
            }
        }
    }

    bool isSelfClosing(const std::string &tagName,int occurrence){

        std::string openTag = "<"+tagName;
        size_t pos = 0;
        int count = 0;

        while((pos = text.find(openTag,pos)) != std::string::npos){

            size_t nextPos = pos + openTag.size();
            if(nextPos < text.size()){
                char nextChar = text[nextPos];
                if(nextChar!=' ' && nextChar!='\t' && nextChar!='\n' &&
                   nextChar!='\r' && nextChar!='>' && nextChar!='/'){
                    pos++;
                    continue;
                }
            }

            if(count==occurrence){
                size_t endPos = text.find('>',pos);
                if(endPos!=std::string::npos && endPos>0){
                    return text[endPos-1]=='/';
                }
                return false;
            }

            count++;
            pos++;
        }

        return false;
    }

    static void startHandler(void *data,const XML_Char *name,const XML_Char **atts){

        SImplementation *self = (SImplementation*)data;

        SXMLEntity entity;
        entity.DType = SXMLEntity::EType::StartElement;
        entity.DNameData = std::string(name);

        int i=0;
        while(atts && atts[i]){
            std::string key = atts[i];
            std::string value = "";
            if(atts[i+1]) value = atts[i+1];
            entity.DAttributes.push_back(std::make_pair(key,value));
            i+=2;
        }

        self->entities.push_back(entity);
    }

    static void endHandler(void *data,const XML_Char *name){
        
        SImplementation *self = (SImplementation*)data;

        SXMLEntity entity;
        entity.DType = SXMLEntity::EType::EndElement;
        entity.DNameData = std::string(name);

        self->entities.push_back(entity);
    }

    static void charHandler(void *data,const XML_Char *s,int len){

        SImplementation *self = (SImplementation*)data;

        SXMLEntity entity;
        entity.DType = SXMLEntity::EType::CharData;
        entity.DNameData = std::string(s,s+len);

        self->entities.push_back(entity);
    }

    bool End() const{

        return index >= (int)entities.size();
    }

    bool ReadEntity(SXMLEntity &entity,bool skipcdata){

        while(index < (int)entities.size()){

            SXMLEntity current = entities[index];
            index++;

            if(current.DNameData == "root"){
                if(current.DType == SXMLEntity::EType::StartElement) continue;
                if(current.DType == SXMLEntity::EType::EndElement) continue;
            }

            if(skipcdata && current.DType == SXMLEntity::EType::CharData){
                continue;
            }

            entity = current;
            return true;
        }

        return false;
    }
};

CXMLReader::CXMLReader(std::shared_ptr<CDataSource> src){

    DImplementation = std::make_unique<SImplementation>(src);
}

CXMLReader::~CXMLReader(){
}

bool CXMLReader::End() const{

    return DImplementation->End();
}

bool CXMLReader::ReadEntity(SXMLEntity &entity,bool skipcdata){
    
    return DImplementation->ReadEntity(entity,skipcdata);
}