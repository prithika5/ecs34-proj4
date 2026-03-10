#include "DSVWriter.h"

struct CDSVWriter::SImplementation{
    std::shared_ptr< CDataSink > DSink;
    char DDelimiter;
    bool DQuoteAll;

    SImplementation(std::shared_ptr< CDataSink > sink, char delimiter, bool quoteall){
        DSink = sink;
        // spec: if delimiter is quote, treat as comma
        DDelimiter = (delimiter == '\"') ? ',' : delimiter;
        DQuoteAll = quoteall;
    }

    ~SImplementation(){

    }

    bool WriteRow(const std::vector<std::string> &row){
        // empty line is a valid row with no values
        if(row.empty()){
            return true;
        }

        auto NeedsQuote = [&](const std::string &s)->bool{
            if(DQuoteAll){
                return true;
            }
            for(char c : s){
                if(c == DDelimiter || c == '\"' || c == '\n' || c == '\r'){
                    return true;
                }
            }
            return false;
        };

        auto WriteEscaped = [&](const std::string &s)->bool{
            // write s with " => ""
            for(char c : s){
                if(c == '\"'){
                    DSink->Put('\"');
                    DSink->Put('\"');
                }
                else{
                    DSink->Put(c);
                }
            }
            return true;
        };

        bool First = true;

        for(const auto &Column : row){
            if(!First){
                DSink->Put(DDelimiter);
            }
            First = false;

            bool Quote = NeedsQuote(Column);

            if(Quote){
                DSink->Put('\"');
            }

            // If no quote needed, we can keep your Buffer+Write style
            if(!Quote){
                std::vector<char> Buffer(Column.begin(), Column.end());
                DSink->Write(Buffer);
            }
            else{
                // Quote needed -> must escape internal quotes and allow newlines, etc.
                WriteEscaped(Column);
            }

            if(Quote){
                DSink->Put('\"');
            }
        }

        return true;
    }
};

CDSVWriter::CDSVWriter(std::shared_ptr< CDataSink > sink, char delimiter, bool quoteall){
    DImplementation = std::make_unique<SImplementation>(sink,delimiter,quoteall);
}

CDSVWriter::~CDSVWriter(){

}

bool CDSVWriter::WriteRow(const std::vector<std::string> &row){
    return DImplementation->WriteRow(row);
}