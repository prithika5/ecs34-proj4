#include "OpenStreetMap.h"
#include <unordered_map>
#include <vector>
#include <memory>
#include <string>

struct COpenStreetMap::SImplementation{
    
    const std::string DOSMTag = "osm";
    const std::string DNodeTag = "node";
    const std::string DNodeIDAttr = "id";
    const std::string DNodeLatAttr = "lat";
    const std::string DNodeLonAttr = "lon";
    const std::string DWayTag = "way";
    const std::string DWayIDAttr = "id";
    const std::string DNDTag = "nd";
    const std::string DNDRefAttr = "ref";
    const std::string DTagTag = "tag";
    const std::string DTagKeyAttr = "k";
    const std::string DTagValAttr = "v";

    struct SNode: public CStreetMap::SNode{

        TNodeID DID{};
        SLocation DLocation{};
        std::vector<std::string> Keys;
        std::unordered_map<std::string,std::string> Attrs;

        ~SNode(){};

        TNodeID ID() const noexcept override{
            return DID;
        }

        SLocation Location() const noexcept override{
            return DLocation;
        }

        std::size_t AttributeCount() const noexcept override{
            return Keys.size();
        }

        std::string GetAttributeKey(std::size_t index) const noexcept override{

            if(index >= Keys.size()){
                return "";
            }
            return Keys[index];
        }

        bool HasAttribute(const std::string &key) const noexcept override{

            if(Attrs.find(key) == Attrs.end()){
                return false;
            }
            return true;
        }

        std::string GetAttribute(const std::string &key) const noexcept override{

            auto it = Attrs.find(key);
            if(it == Attrs.end()){
                return "";
            }
            return it->second;
        }
    };

    struct SWay: public CStreetMap::SWay{

        TWayID DID{};
        std::vector<TNodeID> Nodes;

        std::vector<std::string> Keys;
        std::unordered_map<std::string,std::string> Attrs;

        ~SWay(){};

        TWayID ID() const noexcept override{
            return DID;
        }

        std::size_t NodeCount() const noexcept override{
            return Nodes.size();
        }

        TNodeID GetNodeID(std::size_t index) const noexcept override{

            if(index >= Nodes.size()){
                return CStreetMap::InvalidNodeID;
            }
            return Nodes[index];
        }

        std::size_t AttributeCount() const noexcept override{
            return Keys.size();
        }

        std::string GetAttributeKey(std::size_t index) const noexcept override{

            if(index >= Keys.size()){
                return "";
            }
            return Keys[index];
        }

        bool HasAttribute(const std::string &key) const noexcept override{

            if(Attrs.find(key) == Attrs.end()){
                return false;
            }
            return true;
        }

        std::string GetAttribute(const std::string &key) const noexcept override{

            auto it = Attrs.find(key);
            if(it == Attrs.end()){
                return "";
            }
            return it->second;
        }
    };

    std::vector<std::shared_ptr<SNode>> DNodesByIndex;
    std::unordered_map<TNodeID,std::shared_ptr<SNode>> DNodesByID;
    std::vector<std::shared_ptr<SWay>> DWaysByIndex;
    std::unordered_map<TWayID,std::shared_ptr<SWay>> DWaysByID;

    bool ParseNodes(std::shared_ptr<CXMLReader> src, SXMLEntity &nextentity){

        SXMLEntity e;

        while(src->ReadEntity(e)){

            if(e.DType == SXMLEntity::EType::EndElement){
                if(e.DNameData == DOSMTag){
                    nextentity.DType = SXMLEntity::EType::CharData;
                    nextentity.DNameData.clear();
                    nextentity.DAttributes.clear();
                    return true;
                }
            }

            if(e.DType == SXMLEntity::EType::StartElement){
                if(e.DNameData == DWayTag){
                    nextentity = e;
                    return true;
                }
            }

            if(e.DType == SXMLEntity::EType::CompleteElement){
                if(e.DNameData == DWayTag){
                    nextentity = e;
                    return true;
                }
            }

            bool isNode = false;
            if(e.DType == SXMLEntity::EType::StartElement){
                if(e.DNameData == DNodeTag){
                    isNode = true;
                }
            }
            if(e.DType == SXMLEntity::EType::CompleteElement){
                if(e.DNameData == DNodeTag){
                    isNode = true;
                }
            }

            if(isNode){
                std::string idStr = e.AttributeValue(DNodeIDAttr);
                std::string latStr = e.AttributeValue(DNodeLatAttr);
                std::string lonStr = e.AttributeValue(DNodeLonAttr);

                if(idStr.empty()){
                    continue;
                }
                if(latStr.empty()){
                    continue;
                }
                if(lonStr.empty()){
                    continue;
                }

                TNodeID id = (TNodeID)std::stoull(idStr);
                double lat = std::stod(latStr);
                double lon = std::stod(lonStr);

                auto node = std::make_shared<SNode>();
                node->DID = id;
                node->DLocation = SLocation(lat, lon);

                DNodesByIndex.push_back(node);
                DNodesByID[id] = node;

                if(e.DType == SXMLEntity::EType::CompleteElement){
                    continue;
                }

                SXMLEntity child;
                while(src->ReadEntity(child)){
                    if(child.DType == SXMLEntity::EType::CompleteElement){
                        if(child.DNameData == DTagTag){
                            std::string k = child.AttributeValue(DTagKeyAttr);
                            std::string v = child.AttributeValue(DTagValAttr);

                            if(!k.empty()){
                                if(node->Attrs.find(k) == node->Attrs.end()){
                                    node->Keys.push_back(k);
                                }
                                node->Attrs[k] = v;
                            }
                        }
                    }

                    if(child.DType == SXMLEntity::EType::EndElement){
                        if(child.DNameData == DNodeTag){
                            break;
                        }
                    }
                }
            }
        }

        nextentity.DType = SXMLEntity::EType::CharData;
        nextentity.DNameData.clear();
        nextentity.DAttributes.clear();
        return true;
    }

    bool ParseWays(std::shared_ptr<CXMLReader> src, SXMLEntity &firstentity){

        SXMLEntity e = firstentity;

        auto handleWay = [&](const SXMLEntity &start){
            std::string idStr = start.AttributeValue(DWayIDAttr);
            if(idStr.empty()){
                return;
            }

            TWayID id = (TWayID)std::stoull(idStr);

            auto way = std::make_shared<SWay>();
            way->DID = id;

            if(start.DType == SXMLEntity::EType::CompleteElement){
                DWaysByIndex.push_back(way);
                DWaysByID[id] = way;
                return;
            }

            SXMLEntity child;
            while(src->ReadEntity(child)){

                if(child.DType == SXMLEntity::EType::CompleteElement){
                    if(child.DNameData == DNDTag){
                        std::string refStr = child.AttributeValue(DNDRefAttr);
                        if(!refStr.empty()){
                            TNodeID ref = (TNodeID)std::stoull(refStr);
                            if(DNodesByID.find(ref) != DNodesByID.end()){
                                way->Nodes.push_back(ref);
                            }
                        }
                    }

                    if(child.DNameData == DTagTag){
                        std::string k = child.AttributeValue(DTagKeyAttr);
                        std::string v = child.AttributeValue(DTagValAttr);

                        if(!k.empty()){
                            if(way->Attrs.find(k) == way->Attrs.end()){
                                way->Keys.push_back(k);
                            }
                            way->Attrs[k] = v;
                        }
                    }
                }

                if(child.DType == SXMLEntity::EType::EndElement){
                    if(child.DNameData == DWayTag){
                        break;
                    }
                }
            }

            DWaysByIndex.push_back(way);
            DWaysByID[id] = way;
        };

        bool firstIsWay = false;
        if(e.DType == SXMLEntity::EType::StartElement){
            if(e.DNameData == DWayTag){
                firstIsWay = true;
            }
        }
        if(e.DType == SXMLEntity::EType::CompleteElement){
            if(e.DNameData == DWayTag){
                firstIsWay = true;
            }
        }

        if(firstIsWay){
            handleWay(e);
        }

        while(src->ReadEntity(e)){
            bool isWay = false;

            if(e.DType == SXMLEntity::EType::StartElement){
                if(e.DNameData == DWayTag){
                    isWay = true;
                }
            }

            if(e.DType == SXMLEntity::EType::CompleteElement){
                if(e.DNameData == DWayTag){
                    isWay = true;
                }
            }

            if(isWay){
                handleWay(e);
            }
        }

        return true;
    }

    bool ParseOpenStreetMap(std::shared_ptr<CXMLReader> src){

        SXMLEntity e;

        bool gotElement = false;
        while(src->ReadEntity(e)){
            if(e.DType == SXMLEntity::EType::StartElement){
                gotElement = true;
                break;
            }
            if(e.DType == SXMLEntity::EType::CompleteElement){
                gotElement = true;
                break;
            }
        }

        if(!gotElement){
            return true;
        }

        if(e.DNameData != DOSMTag){
            return false;
        }

        if(e.DType == SXMLEntity::EType::CompleteElement){
            return true;
        }

        bool ok = ParseNodes(src, e);
        if(!ok){
            return false;
        }

        bool isWay = false;
        if(e.DType == SXMLEntity::EType::StartElement){
            if(e.DNameData == DWayTag){
                isWay = true;
            }
        }
        if(e.DType == SXMLEntity::EType::CompleteElement){
            if(e.DNameData == DWayTag){
                isWay = true;
            }
        }

        if(isWay){
            return ParseWays(src, e);
        }

        return true;
    }

    SImplementation(std::shared_ptr<CXMLReader> src){
        ParseOpenStreetMap(src);
    }

    std::size_t NodeCount() const noexcept{
        return DNodesByIndex.size();
    }

    std::size_t WayCount() const noexcept{
        return DWaysByIndex.size();
    }

    std::shared_ptr<CStreetMap::SNode> NodeByIndex(std::size_t index) const noexcept{
        if(index >= DNodesByIndex.size()){
            return nullptr;
        }
        return DNodesByIndex[index];
    }

    std::shared_ptr<CStreetMap::SNode> NodeByID(TNodeID id) const noexcept{

        auto it = DNodesByID.find(id);
        if(it == DNodesByID.end()){
            return nullptr;
        }
        return it->second;
    }

    std::shared_ptr<CStreetMap::SWay> WayByIndex(std::size_t index) const noexcept{

        if(index >= DWaysByIndex.size()){
            return nullptr;
        }
        return DWaysByIndex[index];
    }

    std::shared_ptr<CStreetMap::SWay> WayByID(TWayID id) const noexcept{

        auto it = DWaysByID.find(id);
        if(it == DWaysByID.end()){
            return nullptr;
        }
        return it->second;
    }
};

COpenStreetMap::COpenStreetMap(std::shared_ptr<CXMLReader> src){
    DImplementation = std::make_unique<SImplementation>(src);
}

COpenStreetMap::~COpenStreetMap(){
}

std::size_t COpenStreetMap::NodeCount() const noexcept{
    return DImplementation->NodeCount();
}

std::size_t COpenStreetMap::WayCount() const noexcept{
    return DImplementation->WayCount();
}

std::shared_ptr<CStreetMap::SNode> COpenStreetMap::NodeByIndex(std::size_t index) const noexcept{
    return DImplementation->NodeByIndex(index);
}

std::shared_ptr<CStreetMap::SNode> COpenStreetMap::NodeByID(TNodeID id) const noexcept{
    return DImplementation->NodeByID(id);
}

std::shared_ptr<CStreetMap::SWay> COpenStreetMap::WayByIndex(std::size_t index) const noexcept{
    return DImplementation->WayByIndex(index);
}

std::shared_ptr<CStreetMap::SWay> COpenStreetMap::WayByID(TWayID id) const noexcept{
    return DImplementation->WayByID(id);
}