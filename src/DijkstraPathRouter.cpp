#include "DijkstraPathRouter.h"
#include <vector>
#include <memory>
#include <utility>
#include <any>
#include <limits>


struct CDijkstraPathRouter::SImplementation{
    struct SVertex;
    using TEdge = std::pair<double,TVertexID>;

    struct SVertex{
        std::vector<TEdge> DEdges;
        std::any DTag;
    };

    std::vector<std::shared_ptr<SVertex>> DVertices;

    SImplementation(){

    }

    ~SImplementation(){

    }

    std::size_t VertexCount() const noexcept{
        return DVertices.size();
    }

    TVertexID AddVertex(std::any tag) noexcept{
        auto NewVertex = std::make_shared<SVertex>();
        NewVertex->DTag = tag;
        TVertexID NewID = DVertices.size();
        DVertices.push_back(NewVertex);
        return NewID;
    }

    std::any GetVertexTag(TVertexID id) const noexcept{
        if(id < DVertices.size()){
            return DVertices[id]->DTag;
        }
        return std::any();
    }

    bool AddEdge(TVertexID src, TVertexID dest, double weight, bool bidir = false) noexcept{
    if(src >= DVertices.size() || dest >= DVertices.size() || weight < 0){
        return false;
    }

    DVertices[src]->DEdges.push_back(std::make_pair(weight,dest));

    if(bidir){
        DVertices[dest]->DEdges.push_back(std::make_pair(weight,src));
    }

    return true;
}

    bool Precompute(std::chrono::steady_clock::time_point deadline) noexcept{
        return true;
    }

   double FindShortestPath(TVertexID src, TVertexID dest, std::vector<TVertexID> &path) noexcept{
    path.clear();

    if(src >= DVertices.size() || dest >= DVertices.size()){
        return NoPathExists;
    }

    std::vector<double> w;
    w.resize(DVertices.size(),std::numeric_limits<double>::max());

    std::vector<TVertexID> p;
    p.resize(DVertices.size(),std::numeric_limits<TVertexID>::max());

    std::vector<bool> v;
    v.resize(DVertices.size(),false);

    w[src] = 0;

    for(std::size_t i = 0; i < DVertices.size(); i++){
        TVertexID c = std::numeric_limits<TVertexID>::max();
        double m = std::numeric_limits<double>::max();

        for(TVertexID j = 0; j < DVertices.size(); j++){
            if(!v[j] && w[j] < m){
                m = w[j];
                c = j;
            }
        }

        if(c == std::numeric_limits<TVertexID>::max()){
            break;
        }

        v[c] = true;

        if(c == dest){
            break;
        }


        for(std::size_t j = 0; j < DVertices[c]->DEdges.size(); j++){
            double ew = DVertices[c]->DEdges[j].first;
            TVertexID n = DVertices[c]->DEdges[j].second;

            if(!v[n] && w[c] != std::numeric_limits<double>::max() && w[c] + ew < w[n]){
                w[n] = w[c] + ew;
                p[n] = c;
            }
        }
    }

    if(w[dest] == std::numeric_limits<double>::max()){
    return NoPathExists;
}


    std::vector<TVertexID> r;
    TVertexID c = dest;

    while(c != src){
        r.push_back(c);
        c = p[c];

        if(c == std::numeric_limits<TVertexID>::max()){
            path.clear();
            return NoPathExists;
    }
}

    r.push_back(src);

    for(std::size_t i = r.size(); i > 0; i--){
        path.push_back(r[i-1]);
}

    return w[dest];
    }
};

CDijkstraPathRouter::CDijkstraPathRouter(){
    DImplementation = std::make_unique<SImplementation>();
}

CDijkstraPathRouter::~CDijkstraPathRouter(){

}

std::size_t CDijkstraPathRouter::VertexCount() const noexcept{
    return DImplementation->VertexCount();
}

CPathRouter::TVertexID CDijkstraPathRouter::AddVertex(std::any tag) noexcept{
    return DImplementation->AddVertex(tag);
}

std::any CDijkstraPathRouter::GetVertexTag(TVertexID id) const noexcept{
    return DImplementation->GetVertexTag(id);
}

bool CDijkstraPathRouter::AddEdge(TVertexID src, TVertexID dest, double weight, bool bidir) noexcept{
    return DImplementation->AddEdge(src,dest,weight,bidir);
}

bool CDijkstraPathRouter::Precompute(std::chrono::steady_clock::time_point deadline) noexcept{
    return DImplementation->Precompute(deadline);
}

double CDijkstraPathRouter::FindShortestPath(TVertexID src, TVertexID dest, std::vector<TVertexID> &path) noexcept{
    return DImplementation->FindShortestPath(src,dest,path);
}
