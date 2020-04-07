# local book flow
                                Synchronous books（batchquery）
                                    |
          ------- --------------local book(redis）-------------------------------------
          |                                          |                                |(todo)
    bridge（burn，mint）                           adex_launcher(processOrders)     --adex_watcher(contractCall)--
                                                                                   |success                     |fail    
                                                                               roallback Book                 do nothing
