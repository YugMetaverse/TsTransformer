import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

const transformer: ts.TransformerFactory<ts.SourceFile> = (context: ts.TransformationContext) => {
  
  const getComments = (node: ts.SourceFile): void => {
    var commentRanges = ts.getLeadingCommentRanges(node.getFullText(), node.getFullStart());
    if (commentRanges && commentRanges.length > 0) {
      var commentRange = commentRanges[0];  
      var commentJson: any = {};
      node.getFullText().slice(commentRange.pos, commentRange.end).split(/\r?\n/).map(line => line.trim().includes(":") ? (commentJson[line.trim().split(/:\s*/)[0]] = line.trim().split(/:\s*/)[1]) : null);
      if (Object.keys(commentJson).length != 0){
        commentJson["sourceFilePath"] = path.relative(path.resolve(), node.fileName);
        var writeFileName = uuid()+".json";
        var scriptItemDir = path.join(path.resolve(), "/.yug/items/scripts");
        !fs.existsSync(scriptItemDir) ? fs.mkdirSync(scriptItemDir, { recursive: true }) : null;
        fs.readdirSync(scriptItemDir).forEach((file) => {
          if(path.extname(file) === ".json") { 
            if (JSON.parse(fs.readFileSync(path.join(path.resolve(), "/.yug/items/scripts/")+file, "utf-8")).sourceFilePath === path.relative(path.resolve(), node.fileName)){
                writeFileName=file; 
            }
            else{
                var mainJsonFile = JSON.parse(fs.readFileSync(path.join(path.resolve(), "/.yug/index.json"), "utf-8"));
                !mainJsonFile.hasOwnProperty("items") ? (mainJsonFile["items"] = []) : null;
                mainJsonFile["items"].push(path.parse(writeFileName).name);
                fs.writeFileSync(path.resolve()+"/.yug/index.json", JSON.stringify(mainJsonFile));
            }
          } 
        });
        fs.writeFileSync(path.resolve()+"/.yug/items/scripts/"+writeFileName, JSON.stringify(commentJson));
      }
    }
  };
  
  const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
    return ts.visitEachChild(node, visitor, context);
  };
  return (node: ts.SourceFile) => {
    getComments(node);
    return ts.visitNode(node, visitor);
  };
};

export default transformer;