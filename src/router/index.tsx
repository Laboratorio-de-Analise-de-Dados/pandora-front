
import {Route, Switch} from "react-router-dom"
import HomePage from "../page/home"
import ExperimentsPage from "../page/experiments"
import ExperimentPage from "../components/page/experiment/[id]"
import FilePage from "../components/page/experiment/[id]/file/[fid]"
const Routes = () => {
  return(
      <Switch>
        <Route exact path="/">
          <HomePage/>
        </Route>

        <Route exact path="/experiments">
          <ExperimentsPage/>
        </Route>
        <Route path="/experiments/:id">
          <ExperimentPage/>
        </Route>
        <Route path="/experiment/:id/file/:fid">
          <FilePage/>
        </Route>

      </Switch>
  )
}

export default Routes